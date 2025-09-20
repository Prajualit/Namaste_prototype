const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ConceptMapping = sequelize.define('ConceptMapping', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  namasteConceptId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'namaste_concepts',
      key: 'id'
    }
  },
  icd11ConceptId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'icd11_concepts',
      key: 'id'
    }
  },
  relationship: {
    type: DataTypes.ENUM(
      'equivalent',
      'source-is-narrower-than-target',
      'source-is-broader-than-target',
      'related-to',
      'not-related-to'
    ),
    allowNull: false,
    defaultValue: 'related-to'
  },
  confidenceScore: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 0.80,
    validate: {
      min: 0.0,
      max: 1.0
    }
  },
  comment: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Mapping metadata
  mappedBy: {
    type: DataTypes.STRING(100),
    defaultValue: 'system'
  },
  validatedBy: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('draft', 'active', 'retired', 'review'),
    defaultValue: 'active'
  }
}, {
  tableName: 'concept_mappings',
  timestamps: true,
  indexes: [
    {
      fields: ['namasteConceptId']
    },
    {
      fields: ['icd11ConceptId']
    },
    {
      fields: ['relationship']
    },
    {
      fields: ['confidenceScore']
    },
    {
      unique: true,
      fields: ['namasteConceptId', 'icd11ConceptId']
    }
  ]
});

module.exports = ConceptMapping;
