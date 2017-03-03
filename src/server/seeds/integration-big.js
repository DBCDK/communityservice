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
- 5000 users
- 500 groups
- 1 to 100 members per group.
- 20 campaigns
- 0 to 1000 participants in each campaign.
- 0 to 500 reviews with 1-5 rating per user.
- 0 to 200 initial posts per group.
- 0 to 100 replies to each post recursively.
- 0 to 100 likes per user
- 0 to 50 follows per user

1 percent of users should be deleted.
1 percent of groups should be deleted.
1 percent of posts should be deleted.

NodeJS memory limit = 1GB.

group->profiles: < 500 * 100 = 50000
profile->groups: < 50000
group->reviews: < 500 * 500 = 250000
group->post: < 500 * 200 = 10000
post->replies: < 10000 * 100 = 100000

total: < 370000 entires
*/


const msDbQueryGracePeriod = 50;

const profiles = 10;
const admins = 1;
const groups = 10;
const membersPerGroupMax = 5;
const campaigns = 5;
const reviewsPerProfileMax = 10;
// const participantsInCampaingsMax = 100:

exports.seed = () => {
  faker.seed(2);
  const communityTable = generateCommunities();
  const adminTable = generateAdminIds();
  const profileTable = generateProfiles();
  const groupTable = generateGroups();
  const campaignTable = generateCampaigns();
  // const reviewTable = generateReviews();
  // const postTable = generatePosts();
  // const likesTable = generateLikes();
  // const followsTable = generateFollows();

  // Indexes: the first index (0) in the array is not used.
  let groupToProfiles = [];
  let profileToGroups = [];
  let groupToReviews = [];

  const service = request(server);

  // Communities
  return Promise.all(communityTable.map(createCommunity))
  .then(results => {
    logger.log.info(`Created ${results.length} communities`);
    // Profiles
    return profileTable.reduce((seq, profile, index) => {
      return seq.then(() => {
        if (index % 10 === 0) {
          logger.log.info(`Processed ${index} profiles`);
        }
        return new Promise(resolve => {
          createProfile(profile)
          .catch(error => {
            logger.log.error({createProfile: error});
          });
          setTimeout(resolve, msDbQueryGracePeriod);
        });
      });
    }, Promise.resolve());
  })
  .then(() => {
    // Groups
    return groupTable.reduce((seq, group, index) => {
      return seq.then(() => {
        if (index % 10 === 0) {
          logger.log.info(`Processed ${index} groups`);
        }
        return new Promise(resolve => {
          createEntity(group)
          .catch(error => {
            logger.log.error({createGroup: error});
          });
          setTimeout(resolve, msDbQueryGracePeriod);
        });
      });
    }, Promise.resolve());
  })
  .then(() => {
    // Members of groups
    let backlogOfPromises = [];
    for (let group = 1; group <= groups; ++group) {
      const members = uniqueRandomListFrom(profiles, logDistributedRandom(membersPerGroupMax));
      groupToProfiles[group] = members;
      members.forEach(profile => {
        safePush(profileToGroups, profile, group);
        backlogOfPromises.push(createMemberOfGroup(group, profile));
      });
    }
    return backlogOfPromises.reduce((seq, promise, index) => {
      return seq.then(() => {
        if (index % 10 === 0) {
          logger.log.info(`Processed ${index} members`);
        }
        return new Promise(resolve => {
          promise
          .catch(error => {
            logger.log.error({createMember: error});
          });
          setTimeout(resolve, msDbQueryGracePeriod);
        });
      });
    }, Promise.resolve());
  })
  .then(() => {
    // Campaigns
    return campaignTable.reduce((seq, campaign, index) => {
      return seq.then(() => {
        if (index % 10 === 0) {
          logger.log.info(`Processed ${index} campaigns`);
        }
        return new Promise(resolve => {
          createEntity(campaign)
          .catch(error => {
            logger.log.error({createCampaign: error});
          });
          setTimeout(resolve, msDbQueryGracePeriod);
        });
      });
    }, Promise.resolve());
  })
  .then(() => {
    // Reviews
    let backlogOfPromises = [];
    for (let profile = 1; profile <= profiles; ++profile) {
      const memberIn = profileToGroups[profile];
      if (!memberIn || memberIn.length === 0) {
        continue;
      }
      for (let i = 0; i < reviewsPerProfileMax; ++i) {
        const group = selectRandomlyFrom(memberIn);
        backlogOfPromises.push(createReview(group, profile));
      }
    }
    return backlogOfPromises.reduce((seq, promise, index) => {
      return seq.then(() => {
        if (index % 10 === 0) {
          logger.log.info(`Processed ${index} review`);
        }
        return new Promise(resolve => {
          promise
          .catch(error => {
            logger.log.error({createMember: error});
          });
          setTimeout(resolve, msDbQueryGracePeriod);
        });
      });
    }, Promise.resolve());
  })
  .then(() => {
    generateFollows();
    generateLikes();

    console.log('groupToProfiles');
    console.log(groupToProfiles);

    console.log('profileToGroups');
    console.log(profileToGroups);

    console.log('groupToReviews');
    console.log(groupToReviews);

    logger.log.info('success');
    // logger.log.info(`Created ${results.length} profiles`);
  })
  .catch(error => {
    logger.log.error({ost: error});
    throw error;
  })
  ;

  function createReview(group, profile) {
    return new Promise((resolve, reject) => {
      // logger.log.info(`Making a review from ${profile} in ${group}`);
      service.post('/v1/community/1/entity')
      .send({
        type: 'review',
        owner_id: profile,
        entity_ref: group,
        title: _.capitalize(faker.lorem.words()),
        contents: faker.lorem.paragraphs(2, '\n')
      })
      .end((error, result) => {
        if (error) {
          return reject(error);
        }
        if (result.status !== 201) {
          return reject(result.body);
        }
        const location = result.header.location;
        const id = location.match(/entity\/(\d+)/)[1];
        logger.log.info(`Created review ${id} from ${profile} in ${group}`);
        safePush(groupToReviews, group, Number(id));
        resolve();
      });
    });
  }

  function createMemberOfGroup(group, profile) {
    return new Promise((resolve, reject) => {
      // logger.log.info(`Making ${profile} a member of ${group}`);
      service.post('/v1/community/1/action')
      .send({
        type: 'member',
        owner_id: profile,
        entity_ref: group
      })
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

  function createEntity(value) {
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
        email: faker.internet.email(),
        avatar: faker.internet.avatar()
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
        title: _.capitalize(faker.lorem.words()),
        contents: faker.lorem.paragraphs(2, '\n')
      });
    }
    return result;
  }

  function generateCampaigns() {
    // TODO: should a campaign point to a group?
    let result = [];
    for (let i = 0; i < campaigns; ++i) {
      const owner_id = faker.random.number() % profiles + 1;
      const past = Date.parse(faker.date.past()) / 1000;
      const future = Date.parse(faker.date.future()) / 1000;
      result.push({
        owner_id,
        type: 'campaign',
        title: _.capitalize(faker.lorem.words()),
        contents: faker.lorem.paragraphs(2, '\n'),
        start_epoch: past,
        end_epoch: future
      });
    }
    return result;
  }

/*
  function generateReviews() {
    let result = [];
    for (let i = 0; i < reviewsPerProfileMax; ++i) {
      const owner_id = faker.random.number() % profiles + 1;
      const past = Date.parse(faker.date.past()) / 1000;
      const future = Date.parse(faker.date.future()) / 1000;
      result.push({
        owner_id,
        type: 'campaign',
        title: _.capitalize(faker.lorem.words()),
        contents: faker.lorem.paragraphs(2, '\n'),
        start_epoch: past,
        end_epoch: future
      });
    }
    return result;
  }
*/
  function generateLikes() {
    return [];
  }

  function generateFollows() {
    return [];
  }

  function selectRandomlyFrom(array) {
    return array[faker.random.number() % array.length];
  }

  function uniqueRandomListFrom(range, maxSize) {
    let list = [];
    for (let i = 0; i < maxSize; ++i) {
      list.push(faker.random.number() % range + 1);
    }
    return _.union(list);
  }

  function logDistributedRandom(max) {
    const exp = faker.random.number() % Math.log(max);
    return Math.round(Math.exp(exp));
  }

  function safePush(arrayOfArrays, index, element) {
    if (!arrayOfArrays[index]) {
      arrayOfArrays[index] = [element];
    }
    else {
      arrayOfArrays[index].push(element);
    }
  }

};
