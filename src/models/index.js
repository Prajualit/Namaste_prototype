const sequelize = require('../config/database');
const NamasteConcept = require('./NamasteConcept');
const ICD11Concept = require('./ICD11Concept');
const ConceptMapping = require('./ConceptMapping');

// Define associations
ConceptMapping.belongsTo(NamasteConcept, {
  foreignKey: 'namasteConceptId',
  as: 'namasteConcept'
});

ConceptMapping.belongsTo(ICD11Concept, {
  foreignKey: 'icd11ConceptId',
  as: 'icd11Concept'
});

NamasteConcept.hasMany(ConceptMapping, {
  foreignKey: 'namasteConceptId',
  as: 'mappings'
});

ICD11Concept.hasMany(ConceptMapping, {
  foreignKey: 'icd11ConceptId',
  as: 'mappings'
});

module.exports = {
  sequelize,
  NamasteConcept,
  ICD11Concept,
  ConceptMapping
};
