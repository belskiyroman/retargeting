const events = require('events');

class FsWathcherCampaignService extends events.EventEmitter {

    constructor (fs, fsWathcherDriver, pathToDirectoryOfCampaigns) {

        super();

        if (!fs || !fsWathcherDriver || !pathToDirectoryOfCampaigns) {
            throw new Error(new Date().toString() + ' Invalid arguments. ' + __filename);
        }

        if  (!fs.existsSync(pathToDirectoryOfCampaigns)) {
            throw new Error('Invalid path to campaign dir. ' + pathToDirectoryOfCampaigns);
        }

        const opt = {
            ignored: /[\/\\]\./,
            cwd: pathToDirectoryOfCampaigns,
            persistent: true,
            usePolling: true,
            interval: 2000
        };
        const watcher = fsWathcherDriver.watch('.', opt);

        watcher
            .on('ready', () => console.log(new Date() + ' FsWathcherCampaignService ready.'))
            .on('error', (...arg) => this.error(...arg));

        setTimeout(() => watcher
            .on('add', (...arg) => this.addCampaign(...arg))
            .on('change', (...arg) => this.changeCampaign(...arg))
            .on('unlink', (...arg) => this.removeCampaign(...arg)),
        1000);

    }

    addCampaign (path) {
        const campaignText = this.readFile(path);
        const [campaignOwnerFromPath, campaignNameFromPath] = this.getCampaignInfo(path);

        campaignText
            .then((...arg) => this.parseJSON(...arg))
            .then((campaignConf) => {
                if (!campaignConf) return;
                const {campaignOwner, campaignName, segments} = campaignConf;
                if (!campaignOwner || !campaignName || !segments) return;

                console.log('FsWathcherCampaignService: add campaign ' + path);
                if (campaignOwner !== campaignOwnerFromPath) console.warn(new Date(), 'Warning: name of folder not equal campaignOwner! File: ' + path);
                if (campaignName !== campaignNameFromPath) console.warn(new Date(), 'Warning: name of file campaign not equal campaignName! File: ' + path);

                this.emit('add', campaignConf);
            });

    }

    changeCampaign (path) {
        const campaignText = this.readFile(path);
        const [campaignOwnerFromPath, campaignNameFromPath] = this.getCampaignInfo(path);

        campaignText
            .then((...arg) => this.parseJSON(...arg))
            .then((campaignConf) => {
                if (!campaignConf) return;
                const {campaignOwner, campaignName, segments} = campaignConf;
                if (!campaignOwner || !campaignName || !segments) return;

                console.log('FsWathcherCampaignService: change campaign ' + path);
                if (campaignOwner !== campaignOwnerFromPath) console.warn(new Date(), 'Warning: name of folder not equal campaignOwner! File: ' + path);
                if (campaignName !== campaignNameFromPath) console.warn(new Date(), 'Warning: name of file campaign not equal campaignName! File: ' + path);

                this.emit('change', campaignConf);
            });

    }

    removeCampaign (path) {
        const [campaignOwnerFromPath, campaignNameFromPath] = this.getCampaignInfo(path);
        console.log('FsWathcherCampaignService: remove campaign ' + path);
        this.emit('remove', campaignOwnerFromPath, campaignNameFromPath);
    }

    error (err) {
        console.error(new Date() + 'Error: ' + __filename);
    }

    readFile (path) {
        const absolutPath = this.normalizePath(pathToDirectoryOfCampaigns) + '/' + path;
        const promise = new Promise((resolve, reject) => {
            fs.readFile(
                absolutPath,
                (err, data) => err ? reject(err) : resolve(data)
            );
        });

        return promise;
    }

    parseJSON (jsonText) {
        try {
            return JSON.parse(jsonText);
        } catch (e) {
            return null;
        }
    }

    getCampaignInfo (path) {
        if (typeof path !== 'string') return [];
        return path.split('.')[0].split('/');
    }

    normalizePath (path) {
        if (typeof path !== 'string') return '';
        const partsOfPath = path.split('/');
        const lastPart = partsOfPath[partsOfPath.length-1];
        if (lastPart === '/') partsOfPath.pop();
        return partsOfPath.join('/');
    }

}

module.exports = FsWathcherCampaignService;