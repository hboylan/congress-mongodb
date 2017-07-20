module.exports = mongoose => {
  const Schema = mongoose.Schema;

  const MemberSchema = new Schema({
    __v: { type: Number, select: false },
    current: { type: Boolean, default: false, index: true },
    party: { type: String, index: true },
    state: { type: String, index: true },
    id: {
      thomas: { type: String, required: true, index: true, unique: true },
      govtrack: { type: Number, required: true, index: true, unique: true }
    },
    name: {
      first: { type: String, required: true },
      last: { type: String, required: true },
      official_full: { type: String, required: true }
    },
    bio: {
      birthday: { type: Date, required: true },
      gender: { type: String, required: true, enums: ['M', 'F'] },
      religion: String
    },
    terms: { type: Array, default: [] }
  }, {
    noVirtualId: true
  });

  return {name: 'Member', schema: MemberSchema};
};
