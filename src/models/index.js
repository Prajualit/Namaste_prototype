// Hybrid approach: Import ES6 database config but use CommonJS for models temporarily
import sequelizeInstance from '../config/database.js';

// Use createRequire for CommonJS models
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Re-require the models with the updated sequelize instance
const NamasteConcept = sequelizeInstance.define('NamasteConcept', {
  id: {
    type: sequelizeInstance.Sequelize.DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: sequelizeInstance.Sequelize.DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  display: {
    type: sequelizeInstance.Sequelize.DataTypes.STRING(255),
    allowNull: false
  },
  definition: {
    type: sequelizeInstance.Sequelize.DataTypes.TEXT,
    allowNull: true
  },
  system: {
    type: sequelizeInstance.Sequelize.DataTypes.ENUM('ayurveda', 'siddha', 'unani'),
    allowNull: false
  },
  systemUri: {
    type: sequelizeInstance.Sequelize.DataTypes.STRING(255),
    allowNull: false
  },
  status: {
    type: sequelizeInstance.Sequelize.DataTypes.ENUM('active', 'inactive', 'deprecated'),
    defaultValue: 'active'
  },
  properties: {
    type: sequelizeInstance.Sequelize.DataTypes.JSON,
    defaultValue: {}
  }
}, {
  tableName: 'namaste_concepts',
  timestamps: true
});

const ICD11Concept = sequelizeInstance.define('ICD11Concept', {
  id: {
    type: sequelizeInstance.Sequelize.DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  code: {
    type: sequelizeInstance.Sequelize.DataTypes.STRING(50),
    allowNull: false,
    unique: true
  },
  display: {
    type: sequelizeInstance.Sequelize.DataTypes.STRING(255),
    allowNull: false
  },
  definition: {
    type: sequelizeInstance.Sequelize.DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'icd11_concepts',
  timestamps: true
});

const ConceptMapping = sequelizeInstance.define('ConceptMapping', {
  id: {
    type: sequelizeInstance.Sequelize.DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  namasteConceptId: {
    type: sequelizeInstance.Sequelize.DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'namaste_concepts',
      key: 'id'
    }
  },
  icd11ConceptId: {
    type: sequelizeInstance.Sequelize.DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'icd11_concepts', 
      key: 'id'
    }
  },
  equivalence: {
    type: sequelizeInstance.Sequelize.DataTypes.ENUM('equivalent', 'source-is-narrower-than-target', 'source-is-broader-than-target', 'related-to', 'not-related-to'),
    allowNull: false,
    defaultValue: 'equivalent'
  }
}, {
  tableName: 'concept_mappings',
  timestamps: true
});

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

export {
  sequelizeInstance as sequelize,
  NamasteConcept,
  ICD11Concept,
  ConceptMapping
};

export default {
  sequelize: sequelizeInstance,
  NamasteConcept,
  ICD11Concept,
  ConceptMapping
};
