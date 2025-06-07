import SQLite from 'react-native-sqlite-storage';

// Enable promise-based operations
SQLite.enablePromise(true);

const DATABASE_NAME = 'Rhythmk.db';
const DATABASE_LOCATION = 'default';

let db;

export const openDatabase = async () => {
  if (db) {
    console.log('Returning existing DB instance.');
    return db;
  }
  try {
    console.log('Attempting to open database with SQLite.openDatabase...');
    const openedDb = await SQLite.openDatabase(
      { name: DATABASE_NAME, location: DATABASE_LOCATION },
      () => console.log('SQLite.openDatabase success callback invoked.'),
      (err) => console.error('SQLite.openDatabase error callback invoked:', err)
    );

    if (!openedDb) {
      console.error('SQLite.openDatabase resolved but the db object is null or undefined.');
      throw new Error('SQLite.openDatabase failed to return a valid database object.');
    }
    
    db = openedDb; // Assign to global 'db' only if valid
    console.log('Database opened successfully. DB object:', db);
    return db;
  } catch (error) {
    console.error('Error in openDatabase function:', error.message, error.stack);
    throw error; // Re-throw the error to be caught by the caller
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
        duration INTEGER NOT NULL, -- Store duration in seconds
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
  const { activityType, customActivityName, date, duration, intensity, notes, caloriesBurned } = activity; // Expect 'duration' in seconds
  const sql = `
    INSERT INTO activities (activityType, customActivityName, date, duration, intensity, notes, caloriesBurned)
    VALUES (?, ?, ?, ?, ?, ?, ?);
  `;
  const params = [activityType, customActivityName, date, duration, intensity, notes, caloriesBurned];
  
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

// Function to get all activities
export const getActivities = async () => {
  try {
    const db = await openDatabase();
    const results = await db.executeSql('SELECT * FROM activities ORDER BY date DESC;');
    const activities = [];
    if (results[0]) { // results is an array, first element contains the rows
      for (let i = 0; i < results[0].rows.length; i++) {
        activities.push(results[0].rows.item(i));
      }
    }
    console.log('Activities fetched successfully:', activities);
    return { success: true, data: activities };
  } catch (error) {
    console.error('Error fetching activities:', error);
    return { success: false, error: error.message };
  }
};

// Function to delete an activity by its ID
export const deleteActivity = async (id) => {
  try {
    const db = await openDatabase();
    await db.executeSql('DELETE FROM activities WHERE id = ?;', [id]);
    console.log(`Activity with id ${id} deleted successfully.`);
    return { success: true };
  } catch (error) {
    console.error(`Error deleting activity with id ${id}:`, error);
    return { success: false, error: error.message };
  }
};

// Function to update an existing activity
export const updateActivity = async (id, updates) => {
  try {
    // Create the dynamic part of the SQL query based on the provided updates
    const updateFields = [];
    const values = [];
    
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        values.push(updates[key]);
      }
    });
    
    // Add the ID at the end of the values array for the WHERE clause
    values.push(id);
    
    // Construct the final SQL query
    const sql = `UPDATE activities SET ${updateFields.join(', ')} WHERE id = ?;`;
    
    const db = await openDatabase();
    await db.executeSql(sql, values);
    console.log(`Activity with id ${id} updated successfully.`);
    return { success: true };
  } catch (error) {
    console.error(`Error updating activity with id ${id}:`, error);
    return { success: false, error: error.message };
  }
};
