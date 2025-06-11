import SQLite from 'react-native-sqlite-storage';
import { Platform } from 'react-native';

// Enable promise-based operations
SQLite.enablePromise(true);

const DATABASE_NAME = 'Rhythmk.db';
let db;

export const openDatabase = async () => {
  if (db) {
    console.log('Returning existing DB instance.');
    return db;
  }
  
  try {
    console.log('Attempting to open database with SQLite.openDatabase...');
    
    // Configure database options
    const dbOptions = {
      name: DATABASE_NAME,
      location: 'default',
    };
    
    // Platform-specific configurations
    if (Platform.OS === 'android') {
      // On Android, we use the default location and let SQLite handle the rest
      dbOptions.location = 'default';
    } else {
      // On iOS, we can use the library database directory
      dbOptions.location = 'Library';
    }
    
    console.log(`Opening database with options:`, dbOptions);
    
    // First try to open the database
    let openedDb;
    try {
      openedDb = await SQLite.openDatabase(
        dbOptions,
        () => console.log('SQLite.openDatabase success callback invoked.'),
        (err) => {
          console.error('SQLite.openDatabase error callback invoked:', err);
          throw err;
        }
      );
    } catch (openError) {
      console.error('Error opening database, will try to create a new one:', openError);
      
      // If opening fails, try to create a new database
      dbOptions.createFromLocation = 1; // This creates the database if it doesn't exist
      
      openedDb = await SQLite.openDatabase(
        dbOptions,
        () => console.log('Successfully created new database'),
        (err) => {
          console.error('Failed to create new database:', err);
          throw err;
        }
      );
    }
    
    if (!openedDb) {
      throw new Error('Failed to open or create database: openedDb is null');
    }
    
    // Test the database connection
    try {
      await new Promise((resolve, reject) => {
        openedDb.transaction(
          (tx) => {
            tx.executeSql(
              'SELECT 1',
              [],
              () => resolve(),
              (_, error) => {
                console.error('Database test query failed:', error);
                reject(error);
                return false;
              }
            );
          },
          (error) => {
            console.error('Database transaction error:', error);
            reject(error);
          }
        );
      });
      
      console.log('Database connection test successful');
    } catch (testError) {
      console.error('Database connection test failed:', testError);
      throw testError;
    }
    
    console.log('Database opened successfully:', {
      dbname: openedDb.dbname,
      dbversion: openedDb.dbversion,
      dblocation: openedDb.dblocation,
    });
    
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
        date TEXT NOT NULL, -- MM-DD-YYYY
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

/**
 * Initializes the database by creating necessary tables if they don't exist
 * @returns {Promise<SQLite.SQLiteDatabase>} The initialized database instance
 * @throws {Error} If database initialization fails
 */
export const initializeDatabase = async () => {
  console.log('Initializing database...');
  
  try {
    // First, ensure the database is open
    console.log('Opening database connection...');
    const database = await openDatabase();
    
    if (!database) {
      throw new Error('Database connection failed: openDatabase() returned null');
    }

    // Create tables if they don't exist
    console.log('Creating database tables if needed...');
    await new Promise((resolve, reject) => {
      database.transaction(
        (tx) => {
          // Create activities table with all required fields
          tx.executeSql(
            `CREATE TABLE IF NOT EXISTS activities (
              id TEXT PRIMARY KEY,
              date TEXT NOT NULL,
              duration INTEGER NOT NULL,
              distance REAL NOT NULL,
              avgPace REAL,
              coordinates TEXT NOT NULL,
              planName TEXT,
              totalElevationGain REAL,
              totalElevationLoss REAL,
              notes TEXT,
              calories INTEGER,
              avgHeartRate INTEGER,
              splits TEXT,
              trackingMode TEXT,
              steps INTEGER
            )`,
            [],
            () => {
              console.log('Activities table verified/created successfully');
              resolve();
            },
            (_, error) => {
              const errorMsg = `Failed to create activities table: ${error.message}`;
              console.error(errorMsg);
              reject(new Error(errorMsg));
              return false;
            }
          );
        },
        (error) => {
          const errorMsg = `Transaction failed during database initialization: ${error.message}`;
          console.error(errorMsg);
          reject(new Error(errorMsg));
        },
        () => {
          console.log('Database initialization transaction completed');
        }
      );
    });
    
    // Verify the database is functional by running a test query
    try {
      await new Promise((resolve, reject) => {
        database.transaction(tx => {
          tx.executeSql(
            'SELECT COUNT(*) as count FROM activities',
            [],
            (_, { rows }) => {
              console.log(`Database test query successful. Found ${rows.item(0).count} activities.`);
              resolve();
            },
            (_, error) => {
              reject(new Error(`Database test query failed: ${error.message}`));
              return false;
            }
          );
        });
      });
    } catch (testError) {
      console.warn('Database test query warning:', testError.message);
      // Don't fail initialization for test query issues
    }
    
    console.log('Database initialization completed successfully');
    return database;
  } catch (error) {
    const errorMsg = `Failed to initialize database: ${error.message}`;
    console.error(errorMsg, error);
    
    // Add more context to the error if available
    const enhancedError = new Error(errorMsg);
    enhancedError.originalError = error;
    enhancedError.timestamp = new Date().toISOString();
    
    throw enhancedError;
  }
};

// Example of how to execute a query (we'll build more specific functions later)
export const executeSql = async (sql, params = []) => {
  const database = await openDatabase();
  return database.executeSql(sql, params);
};

// CRUD operations for activities

export const addActivity = async (activity) => {
  const db = await openDatabase();
  
  // Ensure required fields have default values
  const defaultActivity = {
    id: Date.now().toString(),
    date: new Date().toISOString(),
    duration: 0,
    distance: 0,
    coordinates: '[]',
    ...activity
  };
  
  const {
    id,
    date,
    duration,
    distance,
    avgPace,
    coordinates,
    planName,
    totalElevationGain,
    totalElevationLoss,
    notes,
    calories,
    avgHeartRate,
    splits,
    trackingMode,
    steps
  } = defaultActivity;
  
  // Convert objects/arrays to JSON strings
  const coordinatesStr = typeof coordinates === 'string' ? coordinates : JSON.stringify(coordinates);
  const splitsStr = splits ? (typeof splits === 'string' ? splits : JSON.stringify(splits)) : null;
  
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO activities (
          id, date, duration, distance, avgPace, coordinates, planName,
          totalElevationGain, totalElevationLoss, notes, calories,
          avgHeartRate, splits, trackingMode, steps
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id, date, duration, distance, avgPace, coordinatesStr, planName,
          totalElevationGain, totalElevationLoss, notes, calories,
          avgHeartRate, splitsStr, trackingMode, steps
        ],
        (_, result) => {
          console.log('Activity saved successfully with ID:', id);
          resolve({ id, ...defaultActivity });
        },
        (_, error) => {
          console.error('Error saving activity:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Function to get all activities
export const getActivities = async () => {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'SELECT * FROM activities ORDER BY date DESC',
        [],
        (_, { rows }) => {
          const activities = [];
          for (let i = 0; i < rows.length; i++) {
            const activity = rows.item(i);
            // Parse JSON strings back to objects
            try {
              if (activity.coordinates) {
                activity.coordinates = JSON.parse(activity.coordinates);
              }
              if (activity.splits) {
                activity.splits = JSON.parse(activity.splits);
              }
            } catch (e) {
              console.warn('Error parsing activity data:', e);
            }
            activities.push(activity);
          }
          console.log(`Retrieved ${activities.length} activities from the database.`);
          resolve(activities);
        },
        (_, error) => {
          console.error('Error fetching activities:', error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Function to delete an activity by its ID
export const deleteActivity = async (id) => {
  const db = await openDatabase();
  
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        'DELETE FROM activities WHERE id = ?',
        [id],
        (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
            console.log(`Activity with id ${id} deleted successfully.`);
            resolve({ success: true });
          } else {
            const error = new Error(`No activity found with id ${id}`);
            console.error(error.message);
            reject(error);
          }
        },
        (_, error) => {
          console.error(`Error deleting activity with id ${id}:`, error);
          reject(error);
          return false;
        }
      );
    });
  });
};

// Function to update an existing activity
export const updateActivity = async (id, updates) => {
  const db = await openDatabase();
  
  // Create the dynamic part of the SQL query based on the provided updates
  const updateFields = [];
  const values = [];
  
  // Handle JSON serialization for complex fields
  const updatedFields = { ...updates };
  
  if ('coordinates' in updates) {
    updatedFields.coordinates = typeof updates.coordinates === 'string' 
      ? updates.coordinates 
      : JSON.stringify(updates.coordinates);
  }
  
  if ('splits' in updates && updates.splits) {
    updatedFields.splits = typeof updates.splits === 'string'
      ? updates.splits
      : JSON.stringify(updates.splits);
  }
  
  Object.keys(updatedFields).forEach(key => {
    if (updatedFields[key] !== undefined) {
      updateFields.push(`${key} = ?`);
      values.push(updatedFields[key]);
    }
  });
  
  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  // Add the ID at the end of the values array for the WHERE clause
  values.push(id);
  
  const sql = `
    UPDATE activities 
    SET ${updateFields.join(', ')}
    WHERE id = ?;
  `;
  
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        sql,
        values,
        (_, { rowsAffected }) => {
          if (rowsAffected > 0) {
            console.log(`Activity with id ${id} updated successfully.`);
            resolve({ success: true });
          } else {
            const error = new Error(`No activity found with id ${id}`);
            console.error(error.message);
            reject(error);
          }
        },
        (_, error) => {
          console.error(`Error updating activity with id ${id}:`, error);
          reject(error);
          return false;
        }
      );
    });
  });
};

