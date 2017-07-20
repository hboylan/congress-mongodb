module.exports = mongoose => {
  const Schema = mongoose.Schema;
  const ObjectId = mongoose.Schema.ObjectId;

  const BillSchema = new Schema({
    __v: { type: Number, select: false },
    bill_type: { type: String, required: true, index: true, enums: ['hconres', 'hjres', 'hr', 'hres', 's', 'sconres', 'sjres', 'sres'] },
    bill_name: { type: String, required: true },
    official_title: { type: String, required: true },
    introduced_at: { type: Date, required: true },
    bill_id: { type: String, required: true },
    congress: { type: Number, required: true },
    updated_at: Date,

    committees: [{ type: ObjectId, ref: 'committee' }],
    subjects: [{ type: ObjectId, ref: 'bill_subject' }],

    sponsor: { type: ObjectId, ref: 'member' },
    cosponsors: [{ type: ObjectId, ref: 'member' }],

    text_versions: [{
      bill_version_id: String,
      version_code: String,
      issued_on: Date,
      urls: Object
    }]
  });

  return {name: 'Bill', schema: BillSchema};
};
