module.exports = mongoose => {
  const Schema = mongoose.Schema;
  const ObjectId = mongoose.Schema.ObjectId;

  const CommitteeMemberSchema = new Schema({
    __v: {type: Number, select: false},
    committee: {type: ObjectId, ref: 'committee', required: true},
    member: { type: ObjectId, ref: 'member', required: true},
    rank: Number,
    party: String,
    title: {
      type: String,
      enum: [
        'chair',
        'chairman',
        'co_chairman',
        'ex_officio',
        'ranking_member',
        'vice_chair',
        'vice_chairman'
      ]
    }
  }, {
    collection: 'committee_members'
  });

  return {name: 'CommitteeMember', schema: CommitteeMemberSchema};
};
