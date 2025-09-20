const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ICD11Concept = sequelize.define('ICD11Concept', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  display: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  definition: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  systemUri: {
    type: DataTypes.STRING(255),
    allowNull: false,
    defaultValue: 'http://id.who.int/icd/release/11/mms'
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'deprecated'),
    defaultValue: 'active'
  },
  // ICD-11 specific properties
  category: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  parentCode: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  searchVector: {
    type: DataTypes.TSVECTOR
  }
}, {
  tableName: 'icd11_concepts',
  timestamps: true,
  indexes: [
    {
      fields: ['code']
    },
    {
      fields: ['category']
    },
    {
      fields: ['display']
    },
    {
      name: 'icd11_search_idx',
      using: 'gin',
      fields: ['searchVector']
    }
  ]
});

module.exports = ICD11Concept;
