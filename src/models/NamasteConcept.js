const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NamasteConcept = sequelize.define('NamasteConcept', {
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
  system: {
    type: DataTypes.ENUM('ayurveda', 'siddha', 'unani'),
    allowNull: false
  },
  systemUri: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'deprecated'),
    defaultValue: 'active'
  },
  // Additional properties for traditional medicine
  properties: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  searchVector: {
    type: DataTypes.TSVECTOR
  }
}, {
  tableName: 'namaste_concepts',
  timestamps: true,
  indexes: [
    {
      fields: ['code']
    },
    {
      fields: ['system']
    },
    {
      fields: ['display']
    },
    {
      name: 'namaste_search_idx',
      using: 'gin',
      fields: ['searchVector']
    }
  ]
});

module.exports = NamasteConcept;
