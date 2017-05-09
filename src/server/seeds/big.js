'use strict';

const config = require('server/config');
const logger = require('__/logging')(config.logger);
const server = require('server');
const request = require('supertest');
const faker = require('faker');
const _ = require('lodash');
const expectSuccess = require('server/test-verifiers').expectSuccess;

/* eslint-disable no-console */

/*

 Eventually we need

 - 1 community
 - 5000 users
 - 500 groups
 - 0 to 100 members per group.
 - 20 campaigns
 - 0 to 1000 participants in each campaign.
 - 0 to 500 reviews with 1-5 rating per user.
 - 0 to 200 initial posts per group.
 - 0 to 100 replies to each post (recursively).
 - 0 to 100 likes per user
 - 0 to 50 follows per user

 1 percent of users should be deleted.
 1 percent of groups should be deleted.
 1 percent of posts should be deleted.

 Link to random images in 10% of entities.

 Set flags attributes on 1% of posts.

 Modify 10% of entities.
 */

const msDbQueryGracePeriod = 1;

const groups = 100;
const profiles = 10 * groups;
const admins = 10;
const membersPerGroupMax = 5;
const campaigns = 2 * groups;
const reviewsPerProfileMax = 10;
const participantsInCampaingsMax = profiles / 10;
const submissionRateToCampaings = 0.5;
const postsPerProfileForEachIterationMax = 5;
const likesPerProfileMax = 100;
const followsPerProfileMax = 50;
const logFactor = 10;

exports.seed = () => {
  // Indexes: the first index (0) in the array is not used.
  let groupToProfiles = [];
  let profileToGroups = [];
  let groupToReviews = [];
  let groupToCampaigns = [];
  let profileToCampaigns = [];
  let groupToPosts = [];

  let totalEntries = 0;
  let totalActions = 0;

  faker.seed(2);

  const adminTable = generateAdminIds();

  const service = request(server);

  // Communities
  return Promise.resolve(generateCommunities())
    .then(communityTable => {
      return Promise.all(communityTable.map(creatingCommunity));
    })
    .then(results => {
      console.log(`Created ${results.length} communities`);
      return generateProfiles();
    })
    .then(profileTable => {
      // Profiles
      return sequenceWithDelay(profileTable, msDbQueryGracePeriod, profile => {
        return creatingProfile(profile);
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} profiles`);
        }
      });
    })
    .then(() => {
      return generateGroups();
    })
    .then(groupTable => {
      // Groups
      return sequenceWithDelay(groupTable, msDbQueryGracePeriod, group => {
        return creatingEntity(group);
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} groups`);
        }
      });
    })
    .then(() => {
      return generateMembersOfGroups();
    })
    .then(memberTable => {
      // Members of groups
      return sequenceWithDelay(memberTable, msDbQueryGracePeriod, member => {
        return creatingAction(member);
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} members`);
        }
      });
    })
    .then(() => {
      return generateCampaigns();
    })
    .then(campaignTable => {
      // Campaigns
      return sequenceWithDelay(campaignTable, msDbQueryGracePeriod, campaign => {
        return creatingEntity(campaign)
          .then(id => {
            safePush(groupToCampaigns, campaign.entity_ref, Number(id));
          });
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} campaigns`);
        }
      });
    })
    .then(() => {
      // Participants
      return generateParticipantsOfCampaigns();
    })
    .then(participantTable => {
      return sequenceWithDelay(participantTable, msDbQueryGracePeriod, participant => {
        return creatingAction(participant);
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} participants`);
        }
      });
    })
    .then(() => {
      return generateCampaignSubmission();
    })
    .then(submissionTable => {
      // Submissions to campaigns
      return sequenceWithDelay(submissionTable, msDbQueryGracePeriod, submission => {
        return creatingEntity(submission);
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} submissions`);
        }
      });
    })
    .then(() => {
      return generatePosts();
    })
    .then(postTable => {
      // Posts to groups
      return sequenceWithDelay(postTable, msDbQueryGracePeriod, post => {
        return creatingEntity(post)
          .then(id => {
            safePush(groupToPosts, post.entity_ref, Number(id));
          });
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} posts`);
        }
      });
    })
    .then(() => {
      return generateReviews();
    })
    .then(reviewTable => {
      // Reviews
      return sequenceWithDelay(reviewTable, msDbQueryGracePeriod, review => {
        return creatingEntity(review)
          .then(id => {
            safePush(groupToReviews, review.entity_ref, Number(id));
          });
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} reviews`);
        }
      });
    })
    .then(() => {
      return generateReplies();
    })
    .then(replyTable => {
      // Replies to posts.
      return sequenceWithDelay(replyTable, msDbQueryGracePeriod, post => {
        return creatingEntity(post)
          .then(id => {
            safePush(groupToPosts, post.attributes.group, Number(id));
          });
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} replies`);
        }
      });
    })
    .then(() => {
      return generateReplies();
    })
    .then(replyTable => {
      // More replies to posts.
      return sequenceWithDelay(replyTable, msDbQueryGracePeriod, post => {
        return creatingEntity(post)
          .then(id => {
            safePush(groupToPosts, post.attributes.group, Number(id));
          });
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} replies`);
        }
      });
    })
    .then(() => {
      return generateReplies();
    })
    .then(replyTable => {
      // Even more replies.
      return sequenceWithDelay(replyTable, msDbQueryGracePeriod, post => {
        return creatingEntity(post)
          .then(id => {
            safePush(groupToPosts, post.attributes.group, Number(id));
          });
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} replies`);
        }
      });
    })
    .then(() => {
      return generateReplies();
    })
    .then(replyTable => {
      // More, more, more replies.
      return sequenceWithDelay(replyTable, msDbQueryGracePeriod, post => {
        return creatingEntity(post)
          .then(id => {
            safePush(groupToPosts, post.attributes.group, Number(id));
          });
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} replies`);
        }
      });
    })
    .then(() => {
      return generateReplies();
    })
    .then(replyTable => {
      // More, more, more, more more more replies.
      return sequenceWithDelay(replyTable, msDbQueryGracePeriod, post => {
        return creatingEntity(post)
          .then(id => {
            safePush(groupToPosts, post.attributes.group, Number(id));
            // Remember the largerst entity number.
            totalEntries = id;
          });
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} replies`);
        }
      });
    })
    .then(() => {
      return generateLikes();
    })
    .then(likesTable => {
      return sequenceWithDelay(likesTable, msDbQueryGracePeriod, like => {
        return creatingAction(like);
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} likes`);
        }
      });
    })
    .then(() => {
      return generateFollows();
    })
    .then(followsTable => {
      return sequenceWithDelay(followsTable, msDbQueryGracePeriod, follow => {
        return creatingAction(follow)
          .then(id => {
            // Remember the largerst action number.
            totalActions = id;
          });
      }, index => {
        if (index % logFactor === 0) {
          console.log(`Processed ${index} follows`);
        }
      });
    })
    .then(() => {
      const toDelete = uniqueRandomListOfNumbersFromOneTo(totalActions, totalActions / 100);
      console.log(`Will delete actions ${toDelete}`);
      return sequenceWithDelay(toDelete, msDbQueryGracePeriod, deletingAction, index => {
        if (index % logFactor === 0) {
          console.log(`Deleted ${index} actions`);
        }
      });
    })
    .then(() => {
      const toModify = uniqueRandomListOfNumbersFromOneTo(totalEntries, totalEntries / 50);
      console.log(`Will modify entities ${toModify}`);
      return sequenceWithDelay(toModify, msDbQueryGracePeriod, modifyingEntry, index => {
        if (index % logFactor === 0) {
          console.log(`Modified ${index} entries`);
        }
      });
    })
    .then(() => {
      const toModify = uniqueRandomListOfNumbersFromOneTo(profiles, profiles / 50);
      console.log(`Will modify profiles ${toModify}`);
      return sequenceWithDelay(toModify, msDbQueryGracePeriod, modifyingProfile, index => {
        if (index % logFactor === 0) {
          console.log(`Modified ${index} profiles`);
        }
      });
    })
    .then(() => {
      /*
       console.log('groupToProfiles');
       console.log(groupToProfiles);

       console.log('profileToGroups');
       console.log(profileToGroups);

       console.log('groupToReviews');
       console.log(groupToReviews);

       console.log('groupToCampaigns');
       console.log(groupToCampaigns);

       console.log('profileToCampaigns');
       console.log(profileToCampaigns);

       console.log('groupToPosts');
       console.log(groupToPosts);
       */
      console.log('success');
    })
    .catch(error => {
      console.error(error);
      logger.log.error({sequence: error});
    })
    ;

  function deletingAction(id) {
    console.log(`action ${id}`);
    return new Promise((resolve, reject) => {
      service.get(`/v1/community/1/action/${id}`)
        .expect(200)
        .expect(res => {
          expectSuccess(res.body, (links, action) => {
            service.put(`/v1/community/1/action/${id}`)
              .send({modified_by: action.owner_id})
              .expect(200)
              .end(error => {
                if (_.isNil(error)) {
                  resolve();
                }
                else {
                  reject(error);
                }
              });
          });
        })
        .end(error => {
          if (!_.isNil(error)) {
            reject(error);
          }
        });
    });
  }

  function modifyingEntry(id) {
    console.log(`entity ${id}`);
    return new Promise((resolve, reject) => {
      service.get(`/v1/community/1/entity/${id}`)
        .expect(200)
        .expect(res => {
          expectSuccess(res.body, (links, entity) => {
            // console.log(entity);
            let update = {modified_by: entity.owner_id};
            let attributes = {};
            if (id % 2 === 0) {
              attributes.picture = faker.image.animals();
            }
            if (id % 3 === 0) {
              attributes.flag = faker.hacker.abbreviation();
            }
            if (!_.isEmpty(attributes)) {
              update.attributes = attributes;
            }
            console.log(id);
            console.log(update);
            service.put(`/v1/community/1/entity/${id}`)
              .send(update)
              .expect(200)
              .end(error => {
                if (_.isNil(error)) {
                  resolve();
                }
                else {
                  reject(error);
                }
              });
          });
        })
        .end(error => {
          if (!_.isNil(error)) {
            reject(error);
          }
        });
    });
  }

  function modifyingProfile(id) {
    console.log(`profile ${id}`);
    return new Promise((resolve, reject) => {
      let update = {modified_by: id};
      let attributes = {};
      if (id % 2 === 0) {
        attributes.favourite = [faker.commerce.color(), faker.commerce.color()];
      }
      if (id % 3 === 0) {
        update.name = faker.name.firstName();
      }
      if (!_.isEmpty(attributes)) {
        update.attributes = attributes;
      }
      console.log(update);
      service.put(`/v1/community/1/profile/${id}`)
        .send(update)
        .expect(200)
        .end(error => {
          if (_.isNil(error)) {
            resolve();
          }
          else {
            reject(error);
          }
        });
    });
  }

  function creatingEntity(value, debug) {
    return new Promise((resolve, reject) => {
      if (debug) {
        console.log(`Creating ${JSON.stringify(value)}`);
      }
      service.post('/v1/community/1/entity').send(value)
        .end((error, result) => {
          if (error) {
            return reject(error);
          }
          if (result.status !== 201) {
            return reject(result.body);
          }
          const location = result.header.location;
          const id = location.match(/entity\/(\d+)/)[1];
          resolve(id);
        });
    });
  }

  function creatingAction(value, debug) {
    return new Promise((resolve, reject) => {
      if (debug) {
        console.log(`Creating ${JSON.stringify(value)}`);
      }
      service.post('/v1/community/1/action').send(value)
        .end((error, result) => {
          if (error) {
            return reject(error);
          }
          if (result.status !== 201) {
            return reject(result.body);
          }
          const location = result.header.location;
          const id = location.match(/action\/(\d+)/)[1];
          resolve(id);
          if (debug) {
            console.log(`Created ${id}`);
          }
        });
    });
  }

  function creatingProfile(value) {
    return new Promise((resolve, reject) => {
      service.post('/v1/community/1/profile').send(value)
        .end((error, result) => {
          if (error) {
            return reject(error);
          }
          if (result.status !== 201) {
            return reject(result.body);
          }
          resolve();
        });
    });
  }

  function creatingCommunity(value) {
    return new Promise((resolve, reject) => {
      service.post('/v1/community').send(value)
        .end((error, result) => {
          if (error) {
            return reject(error);
          }
          if (result.status !== 201) {
            return reject(result.body);
          }
          resolve();
        });
    });
  }

  function generateCommunities() {
    return [{
      name: 'Integrator',
      attributes: {
        production: false,
        admin: faker.internet.email()
      }
    }];
  }

  function generateAdminIds() {
    let result = [];
    for (let i = 0; i < admins; ++i) {
      result.push(faker.random.number() % profiles + 1);
    }
    console.log(`Admins: ${result}`);
    return result;
  }

  function generateProfiles() {
    let result = [];
    for (let i = 0; i < profiles; ++i) {
      let attributes = {
        email: faker.internet.email(),
        avatar: faker.internet.avatar(),
        favourite: [faker.commerce.color()]
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
        contents: faker.lorem.paragraphs(2, '\n'),
        attributes: {subject: faker.hacker.noun()}
      });
    }
    return result;
  }

  function generateMembersOfGroups() {
    let result = [];
    for (let group = 1; group <= groups; ++group) {
      const random = logDistributedRandom(membersPerGroupMax);
      const members = uniqueRandomListOfNumbersFromOneTo(profiles, random);
      groupToProfiles[group] = members;
      members.forEach(profile => {
        safePush(profileToGroups, profile, group);
        result.push({
          type: 'member',
          owner_id: profile,
          entity_ref: group
        });
      });
    }
    return result;
  }

  function generateCampaigns() {
    let result = [];
    for (let i = 0; i < campaigns; ++i) {
      const owner_id = faker.random.number() % profiles + 1;
      const past = Date.parse(faker.date.past()) / 1000;
      const future = Date.parse(faker.date.future()) / 1000;
      const memberIn = profileToGroups[owner_id];
      // Some profiles are not members of any group.
      if (!memberIn || memberIn.length === 0) {
        continue;
      }
      let picture = null;
      if (faker.random.number() % logFactor === 0) {
        picture = faker.image.nature();
      }
      result.push({
        owner_id,
        type: 'campaign',
        entity_ref: selectRandomlyFrom(memberIn),
        title: _.capitalize(faker.lorem.words()),
        contents: faker.lorem.paragraphs(2, '\n'),
        attributes: {picture},
        start_epoch: past,
        end_epoch: future
      });
    }
    return result;
  }

  function generateParticipantsOfCampaigns() {
    let result = [];
    for (let group = 1; group <= groups; ++group) {
      const campaignList = groupToCampaigns[group];
      // Some groups do not have campaigns.
      if (!campaignList || campaignList.length === 0) {
        continue;
      }
      const members = groupToProfiles[group];
      campaignList.forEach(campaign => {
        const random = logDistributedRandom(participantsInCampaingsMax);
        const participants = uniqueRandomListTakenFrom(members, random);
        participants.forEach(profile => {
          safePush(profileToCampaigns, profile, campaign);
          result.push({
            type: 'participant',
            owner_id: profile,
            entity_ref: campaign
          });
        });
      });
    }
    return result;
  }

  function generateCampaignSubmission() {
    let result = [];
    for (let profile = 1; profile <= profiles; ++profile) {
      const campaignList = profileToCampaigns[profile];
      // Some profiles do not participate in campaigns.
      if (!campaignList || campaignList.length === 0) {
        continue;
      }
      const submissions = campaignList.length * submissionRateToCampaings;
      const camps = uniqueRandomListTakenFrom(campaignList, submissions);
      camps.forEach(campaign => {
        result.push({
          owner_id: profile,
          entity_ref: campaign,
          type: 'submission',
          title: _.capitalize(faker.lorem.words()),
          contents: faker.lorem.paragraphs(2, '\n'),
          attributes: {picture: faker.image.animals()}
        });
      });
    }
    return result;
  }

  function generateReviews() {
    let result = [];
    for (let profile = 1; profile <= profiles; ++profile) {
      const memberIn = profileToGroups[profile];
      // A profile might not be member in any group.
      if (!memberIn || memberIn.length === 0) {
        continue;
      }
      for (let i = 0; i < reviewsPerProfileMax; ++i) {
        const group = selectRandomlyFrom(memberIn);
        let picture = null;
        if (faker.random.number() % logFactor === 0) {
          picture = faker.image.sports();
        }
        result.push({
          type: 'review',
          owner_id: profile,
          entity_ref: group,
          title: _.capitalize(faker.lorem.words()),
          contents: faker.lorem.paragraphs(2, '\n'),
          attributes: {
            picture,
            rating: faker.random.number() % 6
          }
        });
      }
    }
    return result;
  }

  function generatePosts() {
    let result = [];
    for (let profile = 1; profile <= profiles; ++profile) {
      const memberIn = profileToGroups[profile];
      // A profile might not be member in any group.
      if (!memberIn || memberIn.length === 0) {
        continue;
      }
      const random = logDistributedRandom(postsPerProfileForEachIterationMax);
      for (let i = 0; i < random; ++i) {
        const group = selectRandomlyFrom(memberIn);
        let picture = null;
        if (faker.random.number() % logFactor === 0) {
          picture = faker.image.city();
        }
        result.push({
          type: 'post',
          owner_id: profile,
          entity_ref: group,
          title: _.capitalize(faker.lorem.words()),
          contents: faker.lorem.paragraphs(2, '\n'),
          attributes: {
            picture
          }
        });
      }
    }
    return result;
  }

  function generateReplies() {
    let result = [];
    for (let profile = 1; profile <= profiles; ++profile) {
      const memberIn = profileToGroups[profile];
      // A profile might not be member in any group.
      if (!memberIn || memberIn.length === 0) {
        continue;
      }
      const random = logDistributedRandom(reviewsPerProfileMax);
      for (let i = 0; i < random; ++i) {
        const group = selectRandomlyFrom(memberIn);
        const postsIn = groupToPosts[group];
        // A group might have no posts.
        if (!postsIn || postsIn.length === 0) {
          continue;
        }
        const post = selectRandomlyFrom(postsIn);
        let flagged = null;
        if (faker.random.number() % logFactor === 0) {
          flagged = faker.hacker.abbreviation();
        }
        result.push({
          type: 'post',
          owner_id: profile,
          entity_ref: post,
          title: _.capitalize(faker.lorem.words()),
          contents: faker.lorem.paragraph(),
          // Hack to easily find the group when making threads.
          attributes: {group, flag: flagged}
        });
      }
    }
    return result;
  }

  function generateLikes() {
    let result = [];
    for (let profile = 1; profile <= profiles; ++profile) {
      const memberIn = profileToGroups[profile];
      // A profile might not be member in any group.
      if (!memberIn || memberIn.length === 0) {
        continue;
      }
      // Collect all posts and reviews from all groups the user has access to.
      const allEntities = memberIn.reduce((entries, group) => {
        entries = _.concat(entries, groupToPosts[group], groupToReviews[group]);
        return entries;
      }, []);
      const random = logDistributedRandom(likesPerProfileMax);
      const entries = uniqueRandomListTakenFrom(allEntities, random);
      entries.forEach(entity => {
        result.push({
          type: 'like',
          owner_id: profile,
          entity_ref: entity
        });
      });
    }
    return result;
  }

  function generateFollows() {
    let result = [];
    for (let profile = 1; profile <= profiles; ++profile) {
      const memberIn = profileToGroups[profile];
      // A profile might not be member in any group.
      if (!memberIn || memberIn.length === 0) {
        continue;
      }
      // Collect all profiles from all groups the user has access to.
      const allProfiles = memberIn.reduce((profs, group) => {
        profs = _.concat(profs, groupToProfiles[group]);
        return profs;
      }, []);
      const random = logDistributedRandom(followsPerProfileMax);
      const others = uniqueRandomListTakenFrom(allProfiles, random);
      others.forEach(other => {
        result.push({
          type: 'follow',
          owner_id: profile,
          profile_ref: other
        });
      });
    }
    return result;
  }

  function selectRandomlyFrom(array) {
    return array[faker.random.number() % array.length];
  }

  function uniqueRandomListOfNumbersFromOneTo(maxRange, maxSize) {
    let list = [];
    for (let i = 0; i < maxSize; ++i) {
      list.push(faker.random.number() % maxRange + 1);
    }
    return _.union(list);
  }

  function uniqueRandomListTakenFrom(sourceList, maxSize) {
    let list = [];
    for (let i = 0; i < maxSize; ++i) {
      list.push(sourceList[faker.random.number() % sourceList.length]);
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

  /**
   * Asynchronously process a list of items in sequence.
   * @param  {Array(α)}           list             Items to process.
   * @param  {int}                msDelay          Delay in ms between each processing.
   * @param  {α -> Promise(void)} processing       Processer of one item.
   * @param  {int -> ()}          progressReporter Optional function, called with index of item.
   * @return {Promise(void)}                       Promise of the sequential processing.
   */
  function sequenceWithDelay(list, msDelay, processing, progressReporter) {
    return list.reduce((seq, item, index) => {
      return seq.then(() => {
        if (progressReporter) {
          progressReporter(index);
        }

        return new Promise((resolve, reject) => { // eslint-disable-line no-unused-vars
          processing(item)
            .then(() => {
              setTimeout(resolve, msDelay);
            })
            .catch(error => {
              resolve();
              console.error('This is thrown from a .catch in a promise due to some currently unknown error but the loop is not aborted since resolve() is invoked instead of reject. ', {inside: error}); // eslint-disable-line
              // reject(error);
              // throw Error('inside...');
            });
        });
      });
    }, Promise.resolve());
  }

};
