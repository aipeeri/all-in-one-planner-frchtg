
/**
 * API Testing Utilities
 * 
 * Helper functions to test API integration.
 * Use these in the console or in test screens.
 */

import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete, BACKEND_URL } from './api';

export const apiTests = {
  /**
   * Test backend connectivity
   */
  async testConnection() {
    console.log('🔍 Testing backend connection...');
    console.log('Backend URL:', BACKEND_URL);
    
    if (!BACKEND_URL) {
      console.error('❌ Backend URL not configured!');
      return false;
    }
    
    try {
      const response = await fetch(BACKEND_URL);
      console.log('✅ Backend is reachable');
      return true;
    } catch (error) {
      console.error('❌ Backend is not reachable:', error);
      return false;
    }
  },

  /**
   * Test folders API
   */
  async testFolders() {
    console.log('🔍 Testing folders API...');
    
    try {
      // Get folders
      const folders = await authenticatedGet('/api/folders?type=notes');
      console.log('✅ GET /api/folders:', folders);
      
      // Create folder
      const newFolder = await authenticatedPost('/api/folders', {
        name: 'Test Folder',
        type: 'notes',
      });
      console.log('✅ POST /api/folders:', newFolder);
      
      return true;
    } catch (error) {
      console.error('❌ Folders API test failed:', error);
      return false;
    }
  },

  /**
   * Test notes API
   */
  async testNotes() {
    console.log('🔍 Testing notes API...');
    
    try {
      // Get notes
      const notes = await authenticatedGet('/api/notes');
      console.log('✅ GET /api/notes:', notes);
      
      // Create note
      const newNote = await authenticatedPost('/api/notes', {
        title: 'Test Note',
        content: 'This is a test note',
      });
      console.log('✅ POST /api/notes:', newNote);
      
      return true;
    } catch (error) {
      console.error('❌ Notes API test failed:', error);
      return false;
    }
  },

  /**
   * Test appointments API
   */
  async testAppointments() {
    console.log('🔍 Testing appointments API...');
    
    try {
      // Get appointments
      const appointments = await authenticatedGet('/api/appointments');
      console.log('✅ GET /api/appointments:', appointments);
      
      // Create appointment
      const newAppointment = await authenticatedPost('/api/appointments', {
        title: 'Test Appointment',
        date: new Date().toISOString(),
        description: 'This is a test appointment',
      });
      console.log('✅ POST /api/appointments:', newAppointment);
      
      return true;
    } catch (error) {
      console.error('❌ Appointments API test failed:', error);
      return false;
    }
  },

  /**
   * Test diet API
   */
  async testDiet() {
    console.log('🔍 Testing diet API...');
    
    try {
      // Get diet entries
      const dietEntries = await authenticatedGet('/api/diet');
      console.log('✅ GET /api/diet:', dietEntries);
      
      // Create diet entry
      const newEntry = await authenticatedPost('/api/diet', {
        mealType: 'breakfast',
        foodName: 'Test Food',
        calories: 100,
        date: new Date().toISOString(),
      });
      console.log('✅ POST /api/diet:', newEntry);
      
      return true;
    } catch (error) {
      console.error('❌ Diet API test failed:', error);
      return false;
    }
  },

  /**
   * Run all tests
   */
  async runAll() {
    console.log('🚀 Running all API tests...\n');
    
    const results = {
      connection: await this.testConnection(),
      folders: false,
      notes: false,
      appointments: false,
      diet: false,
    };
    
    if (results.connection) {
      results.folders = await this.testFolders();
      results.notes = await this.testNotes();
      results.appointments = await this.testAppointments();
      results.diet = await this.testDiet();
    }
    
    console.log('\n📊 Test Results:');
    console.log('Connection:', results.connection ? '✅' : '❌');
    console.log('Folders:', results.folders ? '✅' : '❌');
    console.log('Notes:', results.notes ? '✅' : '❌');
    console.log('Appointments:', results.appointments ? '✅' : '❌');
    console.log('Diet:', results.diet ? '✅' : '❌');
    
    const allPassed = Object.values(results).every(r => r);
    console.log('\n' + (allPassed ? '✅ All tests passed!' : '❌ Some tests failed'));
    
    return results;
  },
};

/**
 * Usage in console:
 * 
 * import { apiTests } from '@/utils/api-test';
 * 
 * // Test connection
 * apiTests.testConnection();
 * 
 * // Test specific API
 * apiTests.testNotes();
 * 
 * // Run all tests
 * apiTests.runAll();
 */
