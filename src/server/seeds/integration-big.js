'use strict';

const config = require('server/config');
const logger = require('__/logging')(config.logger);
const server = require('server');
const request = require('supertest');
const faker = require('faker');
const _ = require('lodash');

/*

Eventually we need

- 1 community
- 10000 users
- 500 groups
- 1 to 50 members per group.
- 20 campaigns
- 0 to 1000 participants in each campaign.
- 0 to 500 reviews with 1-5 rating per user.
- 0 to 200 initial posts per group.
- 0 to 100 replies to each initial post.
- 0 ot 100 likes per user
- 0 to 50 follows per user

1 percent of users should be deleted.
1 percent of groups should be deleted.
1 percent of posts should be deleted.

*/

const msDbQueryGracePeriod = 30;

const profiles = 100;
const admins = 5;
const groups = 50;
const membersPerGroupMax = 50;
// const campaigns = 20;
// const participantsInCampaingsMax = 100:

exports.seed = () => {
  faker.seed(2);
  const communityTable = generateCommunities();
  const adminTable = generateAdminIds();
  const profileTable = generateProfiles();
  const groupTable = generateGroups();
  // const reviewsTable = generateReviews();
  // const campaignsTable = generateCampaigns();
  // const likesTable = generateLikes();
  // const followsTable = generateFollows();

  const service = request(server);

  return Promise.all(communityTable.map(createCommunity))
  .then(results => {
    logger.log.info(`Created ${results.length} communities`);
    return profileTable.reduce((seq, profile, index) => {
      return seq.then(() => {
        if (index % 100 === 0) {
          logger.log.info(`Processed ${index} profiles`);
        }
        return new Promise(res => {
          createProfile(profile)
          .catch(error => {
            logger.log.error(error);
          });
          setTimeout(res, msDbQueryGracePeriod);
        });
      });
    }, Promise.resolve());
  })
  .then(() => {
    return groupTable.reduce((seq, group, index) => {
      return seq.then(() => {
        if (index % 10 === 0) {
          logger.log.info(`Processed ${index} groups`);
        }
        return new Promise(res => {
          createGroup(group)
          .catch(error => {
            logger.log.error(error);
          });
          setTimeout(res, msDbQueryGracePeriod);
        });
      });
    }, Promise.resolve());
  })
  .then(() => {
    for (let i = 0; i < groups; ++i) {
      const members = logDistributedRandom(membersPerGroupMax);
      logger.log.info(`${members} members`);
    }
  })
  .then(() => {
    generateReviews();
    generateCampaigns();
    generateFollows();
    generateLikes();
    logger.log.info('success');
    // logger.log.info(`Created ${results.length} profiles`);
  })
  .catch(error => {
    logger.log.error({ost: error});
    throw error;
  })
  ;

  function createGroup(value) {
    return new Promise((resolve, reject) => {
      // logger.log.info(`Creating ${JSON.stringify(value)}`);
      service.post('/v1/community/1/entity').send(value)
      .end((error, result) => {
        if (error) {
          return reject(error);
        }
        if (result.status !== 201) {
          return reject(result.body);
        }
        // logger.log.info(`Created ${JSON.stringify(result)}`);
        resolve();
      });
    });
  }

  function createProfile(value) {
    return new Promise((resolve, reject) => {
      // logger.log.info(`Creating ${JSON.stringify(value)}`);
      service.post('/v1/community/1/profile').send(value)
      .end((error, result) => {
        if (error) {
          return reject(error);
        }
        if (result.status !== 201) {
          return reject(result.body);
        }
        // logger.log.info(`Created ${JSON.stringify(result)}`);
        resolve();
      });
    });
  }

  function createCommunity(value) {
    return new Promise((resolve, reject) => {
      service.post('/v1/community').send(value)
      .end((error, result) => {
        if (error) {
          return reject(error);
        }
        if (result.status !== 201) {
          return reject(result.body);
        }
        // logger.log.info(`Created ${JSON.stringify(result)}`);
        resolve();
      });
    });
  }

  function generateCommunities() {
    return [
      {
        name: 'Integrator',
        attributes: {
          production: false,
          admin: faker.internet.email()
        }
      }
    ];
  }

  function generateAdminIds() {
    let result = [];
    for (let i = 0; i < admins; ++i) {
      result.push(faker.random.number() % profiles + 1);
    }
    logger.log.info({admins: result});
    return result;
  }

  function generateProfiles() {
    let result = [];
    for (let i = 0; i < profiles; ++i) {
      let attributes = {
        email: faker.internet.email()
      };
      if (_.includes(adminTable, i)) {
        attributes.admin = true;
      }
      result.push({
        name: faker.name.firstName(),
        attributes
      });
    }
    return result;
  }

  function generateGroups() {
    let result = [];
    for (let i = 0; i < groups; ++i) {
      const owner_id = faker.random.number() % profiles + 1;
      result.push({
        owner_id,
        type: 'group',
        title: faker.lorem.words(),
        // TODO: check why there is a space between \n and \r.
        contents: faker.lorem.paragraphs()
      });
    }
    return result;
  }

  function generateReviews() {
    return [];
  }

  function generateCampaigns() {
    return [];
  }

  function generateLikes() {
    return [];
  }

  function generateFollows() {
    return [];
  }

  function logDistributedRandom(max) {
    const exp = faker.random.number() % Math.log(max);
    return Math.round(Math.exp(exp));
  }

};
