class MainCtrl {

    constructor (messenger, dbManager, campaign, request, fsWathcher) {
        if (!messenger || !dbManager || !campaign || !request) {
            throw new Error('Invalid arguments. ' + __filename);
        }

        dbManager
            .connect();

        messenger
            .connect()
            .on('message', (data) => this.inputDataHandler(data));

        if (fsWathcher) fsWathcher
            .on('add', (...arg) => campaign.addCampaign(...arg))
            .on('change', (...arg) => campaign.addCampaign(...arg))
            .on('remove', (...arg) => campaign.removeCampaign(...arg));
    }

    inputDataHandler (data) {
        const {retUrl, provider, dci} = data;
        if (!retUrl || !provider || !dci) return;
        const operationObject = campaign.parseUrl(provider, retUrl);

        if (!operationObject.campaignName) return console.warn(new Date(), 'MainCtrl log: unknown company or invalid url: ' + retUrl);

        this.getUserSegments(dci)
            .then(this.isInCampaign.bind(this, operationObject))
            .then(this.makeRequest.bind(this, operationObject));
    }

    getUserSegments (userId) {
        return dbManager
            .getSegmentsByUserId(userId)
            .catch((err) => console.error(new Date(), 'Error: ' + __filename, err));
    }

    isInCampaign (operationObject, userSegments) {
        const {campaignOwner, campaignName} = operationObject;
        const isInCampaign = userSegments.some((segmentId) => campaign.has(campaignOwner, campaignName, segmentId));

        if (process.env.NODE_DEBUG) console.log(new Date(), 'MainCtrl log: user in campaign: ' + isInCampaign);

        return isInCampaign;
    }

    makeRequest (operationObject, isInCampaign) {
        if (!isInCampaign) return;
        request
            .get(operationObject.url)
            .on('error', (err) => {/*console.error(err)*/});

        if (!process.env.NODE_DEBUG) return;
        console.log(new Date(), 'Request log: send request to ' + operationObject.url);
    }

}

module.exports = MainCtrl;