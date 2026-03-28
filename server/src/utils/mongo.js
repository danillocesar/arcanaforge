function cleanMongoFields(doc) {
  if (!doc) return doc;
  const { __v, createdAt, updatedAt, ...rest } = doc;
  return rest;
}

function toPartyJson(doc) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  return { id: _id, ...rest };
}

module.exports = { cleanMongoFields, toPartyJson };
