class CampaignLoaderService {

    constructor (fs, recursiveReadSync, pathToDirectoryOfCampaigns) {

        if  (!fs || !pathToDirectoryOfCampaigns) {
            throw new Error('Invalid arguments. ' + __filename);
        }
        if  (!fs.existsSync(pathToDirectoryOfCampaigns)) {
            throw new Error('Invalid path to campaign dir. ' + pathToDirectoryOfCampaigns);
        }

        this._fs = fs;
        this._recursiveReadSync = recursiveReadSync;
        this._pathToDirectoryOfCampaigns = pathToDirectoryOfCampaigns;

    }

    load () {
        const pathToDirectoryOfCampaigns = this._pathToDirectoryOfCampaigns;
        const recursiveReadSync = this._recursiveReadSync;
        const files = recursiveReadSync(pathToDirectoryOfCampaigns);

        const promises = files.map((path) => {
            return this.readFile(path)
                .then(this.parseJSON.bind(this));
        });

        return Promise.all(promises);
    }

    readFile (path) {
        const fs = this._fs;
        const promise = new Promise((resolve, reject) => {
            fs.readFile(
                path,
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

}

module.exports = CampaignLoaderService;