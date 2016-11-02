class CampaignService {

    constructor (rulesForParseUrl, campaignLoader) {
        if (!rulesForParseUrl && !campaignLoader) {
            throw new Error('Invalid arguments. ' + __filename);
        }

        this._campaigns = {};
        this._rulesForParseUrl = rulesForParseUrl;

        for (let provider in rulesForParseUrl) {
            let campaignParseRules = rulesForParseUrl[provider];
            campaignParseRules.campaignName = new RegExp(campaignParseRules.campaignName, 'i');
            campaignParseRules.campaignName = new RegExp(campaignParseRules.campaignName, 'i');
        }

        campaignLoader
            .load()
            .then((campaignCollection) => {
                campaignCollection.forEach((item) => this.addCampaign(item));
            });
    }

    parseUrl (provider, url) {
        const rulesForParseUrl = this._rulesForParseUrl;

        if (!rulesForParseUrl[provider]) return {};

        const regExpForCampaignName = rulesForParseUrl[provider].campaignName;
        const regExpForUserId = rulesForParseUrl[provider].userId;
        const campaignNameResParse = url.match(regExpForCampaignName);
        const userIdResParse = url.match(regExpForUserId);
        const campaignName = campaignNameResParse ? campaignNameResParse[1] : null;
        const userId = userIdResParse ? userIdResParse[1] : null;

        return {
            url: url,
            userId: userId,
            campaignName: campaignName,
            campaignOwner: provider
        };
    }

    has (campaignOwner, campaignName, segmentId) {
        const campaigns = this._campaigns;
        return !!(campaigns[campaignOwner]
               && campaigns[campaignOwner][campaignName]
               && campaigns[campaignOwner][campaignName][segmentId]);
    }

    addCampaign (campaignConf) {
        const campaigns = this._campaigns;
        const {campaignOwner, campaignName, segments} = campaignConf;
        campaigns[campaignOwner] = campaigns[campaignOwner] || {};
        campaigns[campaignOwner][campaignName] = this.convertToHashMap(segments);
        console.log(new Date(), 'CampaignService: add campaign ' + JSON.stringify(campaignConf));
    }

    removeCampaign (campaignOwner, campaignName) {
        const campaigns = this._campaigns;
        const campaign = campaigns[campaignOwner] && campaigns[campaignOwner][campaignName];
        if (!campaign) return console.log(new Date(), 'CampaignService: remove campaign. Config not available.');
        const jsonConfOfCampaign = this.getJsonConfigOfCampaign(campaignOwner, campaignName, campaign);
        console.log(new Date(), 'CampaignService: remove campaign ' + jsonConfOfCampaign);
        delete campaigns[campaignOwner][campaignName];
        return jsonConfOfCampaign;
    }

    convertToHashMap (arr) {
        const result = arr.reduce((res, item) => {
            res[item] = true;
            return res;
        }, {});

        return result;
    }

    getJsonConfigOfCampaign (campaignOwner, campaignName, segmentsHashMap) {
        const campaignConf = {
            campaignOwner: campaignOwner,
            campaignName: campaignName,
            segments: Object.keys(segmentsHashMap)
        };
        const campaignJsonConf = JSON.stringify(campaignConf);
        return campaignJsonConf;
    }

}

module.exports = CampaignService;