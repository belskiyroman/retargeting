require('dotenv').config();

if (process.env.NODE_SILENT_MODE) for (let method in console) {
    console[method] = function () {};
}

const fs = require('fs');
const path = require('path');
const chokidar = require('chokidar');
const recursiveReadSync = require('recursive-readdir-sync');
const _ = require('underscore');
const redis = require('redis');
const request = require('request');
const kafka = require('kafka-node');

const ROOT_DIR = process.env.ROOT_DIR || __dirname;
const optionsOfMessenger = {
    connectionString: process.env.kafkaConnectionString,
    topic: process.env.kafkaTopic,
    groupId: process.env.kafkaGroupId,
    autoCommitInterval: process.env.kafkaAutoCommitIntervalMs,
    fromOffset: process.env.kafkaFromOffset,
};
const optionsOfDbManager = {
    port: process.env.dbPort,
    host: process.env.dbHost
};
const rulesForParseUrl = {
    test: {
        campaignName: process.env.testCampaignName,
        userId: process.env.testUserId
    }
};

const MainCtrl = require(path.join(ROOT_DIR, 'controllers', 'MainCtrl'));
const CampaignLoaderService = require(path.join(ROOT_DIR, 'services', 'CampaignLoaderService'));
const DbManagerService = require(path.join(ROOT_DIR, 'services', 'DbManagerService'));
const MessengerService = require(path.join(ROOT_DIR, 'services', 'MessengerService.js'));
const CampaignService = require(path.join(ROOT_DIR, 'services', 'CampaignService'));
const FsWathcherCampaignService = require(path.join(ROOT_DIR, 'services', 'FsWathcherCampaignService'));

const fsWathcher = process.env.watchFolderWithCampaign ? new FsWathcherCampaignService(fs, chokidar, process.env.campaignsDir) : null;
const messenger = new MessengerService(kafka, optionsOfMessenger);
const dbManager = new DbManagerService(redis, optionsOfDbManager);
const configOfCampaignLoader = new CampaignLoaderService(fs, recursiveReadSync, process.env.campaignsDir);
const campaign = new CampaignService(rulesForParseUrl, configOfCampaignLoader);
const mainCtrl = new MainCtrl(messenger, dbManager, campaign, request, fsWathcher);
