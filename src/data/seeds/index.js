const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const { NamasteConcept, ICD11Concept, ConceptMapping, sequelize } = require('../../models');
const constants = require('../../config/constants');
const logger = require('../../utils/logger');

class DatabaseSeeder {
  async seedAll() {
    try {
      logger.info('Starting database seeding...');

      // Clear existing data in development
      if (process.env.NODE_ENV !== 'production') {
        await this.clearData();
      }

      // Seed in order: concepts first, then mappings
      await this.seedNamasteConcepts();
      await this.seedICD11Concepts();
      await this.seedConceptMappings();

      logger.info('Database seeding completed successfully');

    } catch (error) {
      logger.error('Seeding failed:', error);
      throw error;
    }
  }

  async clearData() {
    logger.info('Clearing existing data...');
    await ConceptMapping.destroy({ where: {} });
    await NamasteConcept.destroy({ where: {} });
    await ICD11Concept.destroy({ where: {} });
  }

  async seedNamasteConcepts() {
    logger.info('Seeding NAMASTE concepts...');

    const conceptsData = await this.readCSV('namaste-concepts.csv');
    const concepts = conceptsData.map(row => ({
      code: row.code,
      display: row.display,
      definition: row.definition,
      system: row.system,
      systemUri: constants.NAMASTE_SYSTEMS[row.system.toUpperCase()],
      status: 'active',
      properties: JSON.parse(row.properties || '{}')
    }));

    await NamasteConcept.bulkCreate(concepts, { ignoreDuplicates: true });
    logger.info(`Seeded ${concepts.length} NAMASTE concepts`);
  }

  async seedICD11Concepts() {
    logger.info('Seeding ICD-11 concepts...');

    const conceptsData = await this.readCSV('icd11-concepts.csv');
    const concepts = conceptsData.map(row => ({
      code: row.code,
      display: row.display,
      definition: row.definition,
      systemUri: constants.ICD11_SYSTEM,
      status: 'active',
      category: row.category,
      parentCode: row.parentCode
    }));

    await ICD11Concept.bulkCreate(concepts, { ignoreDuplicates: true });
    logger.info(`Seeded ${concepts.length} ICD-11 concepts`);
  }

  async seedConceptMappings() {
    logger.info('Seeding concept mappings...');

    const mappingsData = await this.readCSV('concept-mappings.csv');
    const mappings = [];

    for (const row of mappingsData) {
      const namasteConcept = await NamasteConcept.findOne({ 
        where: { code: row.namasteCode } 
      });
      const icd11Concept = await ICD11Concept.findOne({ 
        where: { code: row.icd11Code } 
      });

      if (namasteConcept && icd11Concept) {
        mappings.push({
          namasteConceptId: namasteConcept.id,
          icd11ConceptId: icd11Concept.id,
          relationship: row.relationship,
          confidenceScore: parseFloat(row.confidenceScore),
          comment: row.comment,
          status: 'active'
        });
      }
    }

    await ConceptMapping.bulkCreate(mappings, { ignoreDuplicates: true });
    logger.info(`Seeded ${mappings.length} concept mappings`);
  }

  async readCSV(filename) {
    return new Promise((resolve, reject) => {
      const results = [];
      const filePath = path.join(__dirname, filename);

      if (!fs.existsSync(filePath)) {
        reject(new Error(`CSV file not found: ${filePath}`));
        return;
      }

      fs.createReadStream(filePath)
        .pipe(csv.parse({ headers: true }))
        .on('error', reject)
        .on('data', row => results.push(row))
        .on('end', () => resolve(results));
    });
  }

  async writeCSV(filename, data) {
    return new Promise((resolve, reject) => {
      const filePath = path.join(__dirname, filename);
      const writeStream = fs.createWriteStream(filePath);

      csv.write(data, { headers: true })
        .pipe(writeStream)
        .on('error', reject)
        .on('finish', resolve);
    });
  }
}

// Sample CSV data generator
async function generateSampleData() {
  console.log('Generating sample CSV data...');

  const seeder = new DatabaseSeeder();

  const namasteData = [
    { code: 'AY001', display: 'Vata Dosha Imbalance', definition: 'Imbalance in Vata dosha causing various symptoms', system: 'ayurveda', properties: '{"dosha":"vata","severity":"moderate"}' },
    { code: 'AY002', display: 'Pitta Dosha Excess', definition: 'Excessive Pitta dosha manifestation', system: 'ayurveda', properties: '{"dosha":"pitta","severity":"high"}' },
    { code: 'AY003', display: 'Kapha Stagnation', definition: 'Stagnant Kapha dosha condition', system: 'ayurveda', properties: '{"dosha":"kapha","severity":"mild"}' },
    { code: 'AY004', display: 'Agni Mandya', definition: 'Digestive fire weakness', system: 'ayurveda', properties: '{"dosha":"all","digestive":"weak"}' },
    { code: 'AY005', display: 'Ama Accumulation', definition: 'Toxic accumulation in body', system: 'ayurveda', properties: '{"toxins":"high","cleansing":"needed"}' },
    { code: 'SI001', display: 'Vatha Kalam Disorder', definition: 'Siddha medicine Vatha humor imbalance', system: 'siddha', properties: '{"humor":"vatha","manifestation":"chronic"}' },
    { code: 'SI002', display: 'Pitham Excess Syndrome', definition: 'Excessive Pitham humor in Siddha system', system: 'siddha', properties: '{"humor":"pitham","manifestation":"acute"}' },
    { code: 'SI003', display: 'Kabam Stagnation', definition: 'Kabam humor stagnation condition', system: 'siddha', properties: '{"humor":"kabam","flow":"blocked"}' },
    { code: 'UN001', display: 'Sanguine Temperament Disorder', definition: 'Hot and moist temperament imbalance', system: 'unani', properties: '{"temperament":"sanguine","quality":"hot_moist"}' },
    { code: 'UN002', display: 'Melancholic Constitution Issue', definition: 'Cold and dry temperament problem', system: 'unani', properties: '{"temperament":"melancholic","quality":"cold_dry"}' },
    { code: 'UN003', display: 'Phlegmatic Imbalance', definition: 'Cold and moist temperament excess', system: 'unani', properties: '{"temperament":"phlegmatic","quality":"cold_moist"}' },
    { code: 'UN004', display: 'Choleric Heat Syndrome', definition: 'Hot and dry temperament dominance', system: 'unani', properties: '{"temperament":"choleric","quality":"hot_dry"}' }
  ];

  const icd11Data = [
    { code: 'MG30.0', display: 'Essential hypertension', definition: 'High blood pressure with no identifiable cause', category: 'Cardiovascular', parentCode: 'MG30' },
    { code: 'MG31.1', display: 'Type 2 diabetes mellitus', definition: 'Non-insulin dependent diabetes', category: 'Endocrine', parentCode: 'MG31' },
    { code: 'MD90.0', display: 'Anxiety disorders', definition: 'Excessive worry and fear responses', category: 'Mental Health', parentCode: 'MD90' },
    { code: 'MF25.2', display: 'Chronic gastritis', definition: 'Long-term inflammation of stomach lining', category: 'Digestive', parentCode: 'MF25' },
    { code: 'ME84.1', display: 'Chronic fatigue syndrome', definition: 'Persistent unexplained fatigue', category: 'General', parentCode: 'ME84' },
    { code: 'MF40.1', display: 'Functional dyspepsia', definition: 'Digestive discomfort without clear cause', category: 'Digestive', parentCode: 'MF40' },
    { code: 'MG24.0', display: 'Sleep disorders', definition: 'Disrupted sleep patterns', category: 'Neurological', parentCode: 'MG24' },
    { code: 'MF50.3', display: 'Irritable bowel syndrome', definition: 'Functional bowel disorder', category: 'Digestive', parentCode: 'MF50' }
  ];

  const mappingData = [
    { namasteCode: 'AY001', icd11Code: 'MD90.0', relationship: 'related-to', confidenceScore: '0.75', comment: 'Vata imbalance often correlates with anxiety' },
    { namasteCode: 'AY002', icd11Code: 'MG30.0', relationship: 'source-is-narrower-than-target', confidenceScore: '0.68', comment: 'Pitta excess can manifest as hypertension' },
    { namasteCode: 'AY003', icd11Code: 'ME84.1', relationship: 'equivalent', confidenceScore: '0.82', comment: 'Kapha stagnation similar to chronic fatigue' },
    { namasteCode: 'AY004', icd11Code: 'MF25.2', relationship: 'related-to', confidenceScore: '0.73', comment: 'Agni Mandya relates to digestive issues' },
    { namasteCode: 'AY005', icd11Code: 'MF40.1', relationship: 'source-is-broader-than-target', confidenceScore: '0.67', comment: 'Ama can cause various digestive problems' },
    { namasteCode: 'SI001', icd11Code: 'MD90.0', relationship: 'related-to', confidenceScore: '0.70', comment: 'Vatha disorders often include anxiety symptoms' },
    { namasteCode: 'SI002', icd11Code: 'MG30.0', relationship: 'related-to', confidenceScore: '0.72', comment: 'Pitham excess can lead to cardiovascular issues' },
    { namasteCode: 'SI003', icd11Code: 'MF50.3', relationship: 'equivalent', confidenceScore: '0.78', comment: 'Kabam stagnation similar to IBS' },
    { namasteCode: 'UN001', icd11Code: 'MG30.0', relationship: 'source-is-broader-than-target', confidenceScore: '0.65', comment: 'Sanguine temperament encompasses various cardiovascular issues' },
    { namasteCode: 'UN002', icd11Code: 'ME84.1', relationship: 'related-to', confidenceScore: '0.69', comment: 'Melancholic constitution often presents with fatigue' },
    { namasteCode: 'UN003', icd11Code: 'MG24.0', relationship: 'related-to', confidenceScore: '0.71', comment: 'Phlegmatic imbalance affects sleep patterns' },
    { namasteCode: 'UN004', icd11Code: 'MG31.1', relationship: 'related-to', confidenceScore: '0.66', comment: 'Choleric heat can contribute to metabolic disorders' }
  ];

  // Write CSV files
  await seeder.writeCSV('namaste-concepts.csv', namasteData);
  await seeder.writeCSV('icd11-concepts.csv', icd11Data);
  await seeder.writeCSV('concept-mappings.csv', mappingData);

  console.log('Sample CSV data generated successfully');
  console.log(`Generated ${namasteData.length} NAMASTE concepts`);
  console.log(`Generated ${icd11Data.length} ICD-11 concepts`);
  console.log(`Generated ${mappingData.length} concept mappings`);
}

// Command line execution
if (require.main === module) {
  const seeder = new DatabaseSeeder();

  if (process.argv.includes('--generate')) {
    generateSampleData()
      .then(() => {
        console.log('✅ Sample data generation completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Sample data generation failed:', error);
        process.exit(1);
      });
  } else {
    seeder.seedAll()
      .then(() => {
        console.log('✅ Database seeding completed');
        process.exit(0);
      })
      .catch((error) => {
        console.error('❌ Database seeding failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { DatabaseSeeder, generateSampleData };