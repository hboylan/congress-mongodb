module.exports = mongoose => {
  const Schema = mongoose.Schema;
  
  const BillSubjectSchema = new Schema({
    __v: {type: Number, select: false},
    value: {type: String, index: {unique: true}, required: true},
    num_bills: Number
  }, {
    collection: 'bill_subjects'
  });

  return {name: 'BillSubject', schema: BillSubjectSchema};
};
