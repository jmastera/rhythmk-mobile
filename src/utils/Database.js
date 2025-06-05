import SQLite from 'react-native-sqlite-storage';

// Enable promise-based operations
SQLite.enablePromise(true);

const DATABASE_NAME = 'Rhythmk.db';
const DATABASE_LOCATION = 'default';

let db;

export const openDatabase = async () => {
  if (db) {
    return db;
  }
  try {
    console.log('Attempting to open database...');
    db = await SQLite.openDatabase(
      { name: DATABASE_NAME, location: DATABASE_LOCATION },
      () => console.log('Database OPENED successfully'),
      (error) => console.error('Error opening database', error)
    );
    console.log('Database object:', db);
    return db;
  } catch (error) {
    console.error('Failed to open database:', error);
    throw error;
  }
};

export const createTables = async (tx) => {
  // Activities table
  await tx.executeSql(`
    CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        activityType TEXT NOT NULL,
        customActivityName TEXT,
        date TEXT NOT NULL, -- YYYY-MM-DD
        durationMinutes INTEGER NOT NULL,
        intensity TEXT, -- e.g., 'Low', 'Medium', 'High'
        notes TEXT,
        caloriesBurned INTEGER
    );
  `);
  console.log('Table "activities" created or already exists.');

  // You can add more table creations here in the future
  // e.g., await tx.executeSql('CREATE TABLE IF NOT EXISTS ...');
};

export const initializeDatabase = async () => {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    database.transaction(async (tx) => {
      try {
        await createTables(tx);
        resolve();
      } catch (error) {
        console.error('Error during table creation transaction:', error);
        reject(error);
      }
    }).catch(error => {
      console.error('Database transaction failed:', error);
      reject(error);
    });
  });
};

// Example of how to execute a query (we'll build more specific functions later)
export const executeSql = async (sql, params = []) => {
  const database = await openDatabase();
  return database.executeSql(sql, params);
};

// CRUD operations for activities

export const addActivity = async (activity) => {
  const { activityType, customActivityName, date, durationMinutes, intensity, notes, caloriesBurned } = activity;
  const sql = `
    INSERT INTO activities (activityType, customActivityName, date, durationMinutes, intensity, notes, caloriesBurned)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;
  const params = [activityType, customActivityName, date, durationMinutes, intensity, notes, caloriesBurned];
  
  try {
    const database = await openDatabase();
    const [results] = await database.executeSql(sql, params);
    if (results.insertId) {
      console.log('Activity added successfully with ID:', results.insertId);
      return { success: true, insertId: results.insertId };
    }
    console.warn('Activity insert did not return an insertId.');
    return { success: false, message: 'Insert did not return an ID.' };
  } catch (error) {
    console.error('Error adding activity:', error);
    return { success: false, error };
  }
};

// We will add functions for getActivities, updateActivity, deleteActivity later
