module.exports = mongoose => {
  const Schema = mongoose.Schema;
  const ObjectId = mongoose.Schema.ObjectId;

  const CommitteeSchema = new Schema({
    __v: {type: Number, select: false},
    thomas_id: {type: String, required: true, index: true, minlength: 4, maxlength: 4},
    type: {type: String, required: true, index: true, enums: ['house', 'senate', 'sub', 'joint']},
    name: {type: String, required: true},
    subcommittees: [{type: ObjectId, ref: 'committee'}],

    leadership: {
      chair: {type: ObjectId, ref: 'Member'},
      chairman: {type: ObjectId, ref: 'Member'},
      co_chairman: {type: ObjectId, ref: 'Member'},
      ex_officio: {type: ObjectId, ref: 'Member'},
      ranking_member: {type: ObjectId, ref: 'Member'},
      vice_chair: {type: ObjectId, ref: 'Member'},
      vice_chairman: {type: ObjectId, ref: 'Member'}
    }
  }, {
    minimize: false
  });

  return {name: 'Committee', schema: CommitteeSchema};
};
