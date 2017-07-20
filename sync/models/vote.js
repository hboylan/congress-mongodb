module.exports = mongoose => {
  const Schema = mongoose.Schema;
  const ObjectId = mongoose.Schema.ObjectId;

  const VoteSchema = new Schema({
    __v: { type: Number, select: false },
    vote_id: { type: String, required: true, index: true, unique: true },
    chamber: { type: String, required: true, index: true, enums: ['h', 's'] },
    congress: { type: Number, required: true, index: true },
    updated_at: { type: Date, index: true },
    date: Date,
    result: String,
    session: String,
    votes: Object
  });

  return {name: 'Bill', schema: BillSchema};
};
