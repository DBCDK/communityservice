'use strict';

const communityTable = 'communities';
const profileTable = 'profiles';

exports.seed = knex => {
  // Communities
  return knex.raw(`alter sequence ${communityTable}_id_seq restart with 1`)
    .then(() => {
      return knex(communityTable).insert({
        name: 'Biblo'
      });
    })
    .then(() => {
      return knex(communityTable).insert({
        name: 'LitteraturSiden',
        attributes: {production: false}
      });
    })
    // Profiles
    .then(() => {
      return knex.raw(`alter sequence ${profileTable}_id_seq restart with 1`);
    })
    .then(() => {
      return knex(profileTable).insert({
        community_id: 1,
        name: 'Pink ',
        attributes: {
          libraryId: 654321,
          description: 'Jeg er en pige på 11 år og jeg elsker at høre musik og at være sammen med mine venner.',
          email: 'pink@gmail.com'
        }
      });
    })
    .then(() => {
      return knex(profileTable).insert({
        community_id: 1,
        name: 'Kaptajn underhyler',
        attributes: {
          libraryId: 648485,
          description: `Jeg er superhelt
uden bukser på.`,
          email: 'under_hyler@ebrev.dk'
        }
      });
    })
    .then(() => {
      return knex(profileTable).insert({
        community_id: 1,
        name: 'BiblioteKaren',
        attributes: {
          libraryId: 526443,
          description: `Jeg arbejder på Roskilde Bibliotek.
Jeg står også på vandski.
Og laver lerpotter på en drejebænk.`,
          email: 'Karen.Nielsen@rkb.dk'
        }
      });
    })
    ;
};
