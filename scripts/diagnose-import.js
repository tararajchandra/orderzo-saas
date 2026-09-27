/**
 * Import Diagnostic Script
 * 
 * This script helps diagnose why items are being skipped during import.
 * Run this to validate your import file before uploading.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const FILE_PATH = process.argv[2]; // Pass file path as argument
const DATA_TYPE = process.argv[3]; // Pass data type as argument

if (!FILE_PATH || !DATA_TYPE) {
    console.log('Usage: node diagnose-import.js <file-path> <data-type>');
    console.log('Example: node diagnose-import.js ./menu_items.json menu_items');
    console.log('\nSupported data types: menu_items, categories, delivery_locations, users, salesmen, delivery_boys');
    process.exit(1);
}

// Validation rules for each data type
const VALIDATION_RULES = {
    menu_items: {
        required: ['name', 'price'],
        optional: ['description', 'category_id', 'gst_rate', 'available', 'image_data_base64', 'image_type'],
        validators: {
            name: (val) => typeof val === 'string' && val.trim().length > 0,
            price: (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
            gst_rate: (val) => val === undefined || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
            available: (val) => val === undefined || val === true || val === false || val === 'true' || val === 'false' || val === '1' || val === '0',
            category_id: (val) => val === undefined || val === null || (!isNaN(parseInt(val)) && parseInt(val) > 0)
        }
    },
    categories: {
        required: ['name'],
        optional: ['description', 'sort_order', 'display_order'],
        validators: {
            name: (val) => typeof val === 'string' && val.trim().length > 0,
            sort_order: (val) => val === undefined || (!isNaN(parseInt(val)) && parseInt(val) >= 0),
            display_order: (val) => val === undefined || (!isNaN(parseInt(val)) && parseInt(val) >= 0)
        }
    },
    delivery_locations: {
        required: ['location_name', 'delivery_charge'],
        optional: ['is_active'],
        validators: {
            location_name: (val) => typeof val === 'string' && val.trim().length > 0,
            delivery_charge: (val) => !isNaN(parseFloat(val)) && parseFloat(val) >= 0,
            is_active: (val) => val === undefined || val === true || val === false || val === 'true' || val === 'false' || val === '1' || val === '0'
        }
    },
    users: {
        required: ['email', 'name'],
        optional: ['phone', 'address'],
        validators: {
            email: (val) => typeof val === 'string' && val.includes('@'),
            name: (val) => typeof val === 'string' && val.trim().length > 0
        }
    },
    salesmen: {
        required: ['name', 'phone'],
        optional: ['email', 'commission_rate', 'commission_type', 'is_active'],
        validators: {
            name: (val) => typeof val === 'string' && val.trim().length > 0,
            phone: (val) => typeof val === 'string' && val.trim().length > 0,
            commission_rate: (val) => val === undefined || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
            commission_type: (val) => val === undefined || val === 'percentage' || val === 'fixed',
            is_active: (val) => val === undefined || val === true || val === false || val === 'true' || val === 'false' || val === '1' || val === '0'
        }
    },
    delivery_boys: {
        required: ['name', 'phone'],
        optional: ['email', 'commission_rate', 'commission_type', 'is_active'],
        validators: {
            name: (val) => typeof val === 'string' && val.trim().length > 0,
            phone: (val) => typeof val === 'string' && val.trim().length > 0,
            commission_rate: (val) => val === undefined || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0),
            commission_type: (val) => val === undefined || val === 'percentage' || val === 'fixed',
            is_active: (val) => val === undefined || val === true || val === false || val === 'true' || val === 'false' || val === '1' || val === '0'
        }
    }
};

// Parse CSV function (same as in the API)
function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let currentValue = '';
        let insideQuotes = false;

        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];

            if (char === '"') {
                insideQuotes = !insideQuotes;
            } else if (char === ',' && !insideQuotes) {
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());

        const row = {};
        headers.forEach((header, index) => {
            let value = values[index] || '';
            // Remove surrounding quotes if present
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1).replace(/""/g, '"');
            }
            row[header] = value;
        });
        data.push(row);
    }

    return data;
}

// Main diagnostic function
function diagnoseImport() {
    console.log('='.repeat(60));
    console.log('Import Diagnostic Tool');
    console.log('='.repeat(60));
    console.log(`File: ${FILE_PATH}`);
    console.log(`Data Type: ${DATA_TYPE}`);
    console.log('='.repeat(60));

    // Check if file exists
    if (!fs.existsSync(FILE_PATH)) {
        console.error(`❌ Error: File not found: ${FILE_PATH}`);
        process.exit(1);
    }

    // Check if data type is valid
    if (!VALIDATION_RULES[DATA_TYPE]) {
        console.error(`❌ Error: Unknown data type: ${DATA_TYPE}`);
        console.log('Supported types:', Object.keys(VALIDATION_RULES).join(', '));
        process.exit(1);
    }

    // Read and parse file
    const fileContent = fs.readFileSync(FILE_PATH, 'utf-8');
    let data;

    try {
        if (FILE_PATH.endsWith('.json')) {
            data = JSON.parse(fileContent);
            if (!Array.isArray(data)) {
                console.error('❌ Error: JSON file must contain an array of objects');
                process.exit(1);
            }
        } else if (FILE_PATH.endsWith('.csv')) {
            data = parseCSV(fileContent);
        } else {
            console.error('❌ Error: Unsupported file format. Use .json or .csv');
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ Error parsing file:', error.message);
        process.exit(1);
    }

    console.log(`\n✅ File parsed successfully`);
    console.log(`Total records found: ${data.length}\n`);

    // Validate each record
    const rules = VALIDATION_RULES[DATA_TYPE];
    const results = {
        valid: [],
        invalid: [],
        warnings: []
    };

    data.forEach((item, index) => {
        const itemErrors = [];
        const itemWarnings = [];
        const recordNum = index + 1;

        // Check required fields
        rules.required.forEach(field => {
            if (item[field] === undefined || item[field] === null || item[field] === '') {
                itemErrors.push(`Missing required field: ${field}`);
            } else if (rules.validators[field] && !rules.validators[field](item[field])) {
                itemErrors.push(`Invalid value for ${field}: ${item[field]}`);
            }
        });

        // Check optional fields if present
        rules.optional.forEach(field => {
            if (item[field] !== undefined && item[field] !== null && item[field] !== '') {
                if (rules.validators[field] && !rules.validators[field](item[field])) {
                    itemErrors.push(`Invalid value for ${field}: ${item[field]}`);
                }
            }
        });

        // Check for duplicate names (common issue)
        if (item.name || item.location_name || item.email) {
            const identifier = item.name || item.location_name || item.email;
            const duplicates = data.filter(d =>
                (d.name === identifier || d.location_name === identifier || d.email === identifier)
            );
            if (duplicates.length > 1) {
                itemWarnings.push(`Duplicate identifier found: ${identifier} (appears ${duplicates.length} times)`);
            }
        }

        // Check for unknown fields
        const allKnownFields = [...rules.required, ...rules.optional];
        const unknownFields = Object.keys(item).filter(key => !allKnownFields.includes(key));
        if (unknownFields.length > 0) {
            itemWarnings.push(`Unknown fields (will be ignored): ${unknownFields.join(', ')}`);
        }

        if (itemErrors.length > 0) {
            results.invalid.push({ recordNum, item, errors: itemErrors, warnings: itemWarnings });
        } else {
            results.valid.push({ recordNum, item, warnings: itemWarnings });
            if (itemWarnings.length > 0) {
                results.warnings.push({ recordNum, item, warnings: itemWarnings });
            }
        }
    });

    // Print results
    console.log('='.repeat(60));
    console.log('VALIDATION RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Valid records: ${results.valid.length}`);
    console.log(`❌ Invalid records: ${results.invalid.length}`);
    console.log(`⚠️  Records with warnings: ${results.warnings.length}`);
    console.log('='.repeat(60));

    // Show invalid records
    if (results.invalid.length > 0) {
        console.log('\n❌ INVALID RECORDS (will be skipped):');
        console.log('-'.repeat(60));
        results.invalid.forEach(({ recordNum, item, errors, warnings }) => {
            console.log(`\nRecord #${recordNum}:`);
            console.log('Data:', JSON.stringify(item, null, 2));
            console.log('Errors:');
            errors.forEach(err => console.log(`  - ${err}`));
            if (warnings.length > 0) {
                console.log('Warnings:');
                warnings.forEach(warn => console.log(`  - ${warn}`));
            }
        });
    }

    // Show warnings
    if (results.warnings.length > 0) {
        console.log('\n⚠️  RECORDS WITH WARNINGS (will be imported but check carefully):');
        console.log('-'.repeat(60));
        results.warnings.forEach(({ recordNum, item, warnings }) => {
            console.log(`\nRecord #${recordNum}:`);
            console.log('Data:', JSON.stringify(item, null, 2));
            console.log('Warnings:');
            warnings.forEach(warn => console.log(`  - ${warn}`));
        });
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('SUMMARY');
    console.log('='.repeat(60));
    console.log(`Expected to import: ${results.valid.length} records`);
    console.log(`Expected to skip: ${results.invalid.length} records`);

    if (results.invalid.length === 0 && results.warnings.length === 0) {
        console.log('\n✅ All records are valid! You can proceed with the import.');
    } else if (results.invalid.length > 0) {
        console.log('\n❌ Some records have errors. Fix them before importing.');
    } else {
        console.log('\n⚠️  Some records have warnings. Review them before importing.');
    }
    console.log('='.repeat(60));
}

// Run diagnostic
diagnoseImport();
