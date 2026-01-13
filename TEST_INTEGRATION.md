
# Backend Integration Testing Guide

## Prerequisites

1. **Backend is running**: `https://rnnb3z2m95gd2ft84ukprkrke2257k5d.app.specular.dev`
2. **App is running**: `npm run dev` or `expo start`
3. **User is authenticated**: Sign in through the auth screen

## Manual Testing Steps

### 1. Authentication Flow

#### Test Sign Up
1. Open app → Should redirect to `/auth`
2. Tap "Sign Up"
3. Enter email and password
4. Tap "Sign Up" button
5. ✅ Should create account and redirect to home

#### Test Sign In (Email)
1. Open app → Should redirect to `/auth`
2. Enter email and password
3. Tap "Sign In" button
4. ✅ Should authenticate and redirect to home

#### Test Sign In (Google)
1. Open app → Should redirect to `/auth`
2. Tap "Continue with Google"
3. **Web**: Popup opens → Sign in → Popup closes
4. **Native**: Browser opens → Sign in → Redirects back to app
5. ✅ Should authenticate and redirect to home

#### Test Sign In (Apple)
1. Open app → Should redirect to `/auth`
2. Tap "Continue with Apple"
3. **Web**: Popup opens → Sign in → Popup closes
4. **Native**: Browser opens → Sign in → Redirects back to app
5. ✅ Should authenticate and redirect to home

### 2. Notes & Folders

#### Test Load Folders
1. Navigate to Notes tab
2. ✅ Should see loading indicator
3. ✅ Should load folders from backend
4. ✅ Should display "All Notes" chip + folder chips

#### Test Create Folder
1. Tap folder+ icon in header
2. Enter folder name: "Test Folder"
3. Tap "Create"
4. ✅ Should create folder via API
5. ✅ Should show success alert
6. ✅ Should add folder to list

#### Test Load Notes
1. Tap "All Notes" chip
2. ✅ Should load all notes from backend
3. Tap a folder chip
4. ✅ Should load notes filtered by folder

#### Test Create Note
1. Tap + FAB button
2. Enter title: "Test Note"
3. Enter content: "This is a test"
4. Tap "Create"
5. ✅ Should create note via API
6. ✅ Should show success alert
7. ✅ Should add note to list

#### Test Create Note in Folder
1. Select a folder
2. Tap + FAB button
3. Enter note details
4. Tap "Create"
5. ✅ Should create note with folderId
6. ✅ Note should appear in selected folder

### 3. Calendar & Appointments

#### Test Load Appointments
1. Navigate to Calendar tab
2. Select "Appointments" tab
3. ✅ Should load appointments for selected date
4. Change date using arrows
5. ✅ Should reload appointments for new date

#### Test Create Appointment
1. Ensure "Appointments" tab is selected
2. Tap + FAB button
3. Enter title: "Doctor Appointment"
4. Enter description: "Annual checkup"
5. Enter location: "123 Main St"
6. Tap "Create"
7. ✅ Should create appointment via API
8. ✅ Should show success alert
9. ✅ Should add appointment to list

### 4. Diet Tracking

#### Test Load Diet Entries
1. Navigate to Calendar tab
2. Select "Diet Plan" tab
3. ✅ Should load diet entries for selected date
4. Change date using arrows
5. ✅ Should reload diet entries for new date

#### Test Create Diet Entry
1. Ensure "Diet Plan" tab is selected
2. Tap + FAB button
3. Select meal type: "Breakfast"
4. Enter food name: "Oatmeal"
5. Enter calories: "300"
6. Enter notes: "With berries"
7. Tap "Add"
8. ✅ Should create diet entry via API
9. ✅ Should show success alert
10. ✅ Should add entry to list
11. ✅ Should update calorie total

#### Test Calorie Calculation
1. Add multiple diet entries
2. ✅ Should see total calories card
3. ✅ Total should sum all entries

### 5. Profile & Statistics

#### Test Load Statistics
1. Navigate to Profile tab
2. ✅ Should show loading indicator
3. ✅ Should load statistics from backend
4. ✅ Should display counts for:
   - Notes
   - Appointments
   - Folders
   - Diet Entries

#### Test Refresh Statistics
1. Create some notes/appointments/diet entries
2. Navigate to Profile tab
3. Tap refresh button (↻)
4. ✅ Should reload statistics
5. ✅ Counts should update

#### Test User Info
1. Navigate to Profile tab
2. ✅ Should display user name or email
3. ✅ Should show user avatar icon

#### Test Sign Out
1. Navigate to Profile tab
2. Tap "Sign Out" button
3. ✅ Should sign out via API
4. ✅ Should redirect to `/auth`
5. ✅ Should clear authentication state

### 6. Protected Routes

#### Test Unauthenticated Access
1. Sign out if signed in
2. Try to navigate to any tab
3. ✅ Should redirect to `/auth`
4. ✅ Should not show tab content

#### Test Authenticated Access
1. Sign in
2. ✅ Should access all tabs
3. ✅ Should see tab content
4. ✅ Should make authenticated API calls

## Automated Testing (Console)

### Test API Connection
```javascript
import { apiTests } from '@/utils/api-test';
await apiTests.testConnection();
```

### Test Specific API
```javascript
await apiTests.testNotes();
await apiTests.testFolders();
await apiTests.testAppointments();
await apiTests.testDiet();
```

### Run All Tests
```javascript
await apiTests.runAll();
```

## Expected Console Logs

### On App Start
```
🚀 App starting...
🔗 Backend URL: https://rnnb3z2m95gd2ft84ukprkrke2257k5d.app.specular.dev
```

### On API Call
```
[API] Calling: https://rnnb3z2m95gd2ft84ukprkrke2257k5d.app.specular.dev/api/notes GET
[API] Success: [{ id: '...', title: '...', ... }]
```

### On API Error
```
[API] Error response: 401 Unauthorized
[API] Request failed: Error: API error: 401 - Unauthorized
```

## Common Issues & Solutions

### Issue: "Backend URL not configured"
**Solution**: Check `app.json` → `expo.extra.backendUrl` is set

### Issue: "Authentication token not found"
**Solution**: Sign in again, check token storage

### Issue: "API error: 401"
**Solution**: Token expired or invalid, sign in again

### Issue: "API error: 404"
**Solution**: Check endpoint URL, verify backend is running

### Issue: "Network request failed"
**Solution**: Check internet connection, verify backend URL

### Issue: Empty lists after creating items
**Solution**: Check console for API errors, verify response format

## Success Criteria

✅ All authentication methods work (email, Google, Apple)
✅ All CRUD operations work (Create, Read)
✅ All screens load data from backend
✅ All forms submit data to backend
✅ Error handling shows user-friendly messages
✅ Loading states display during API calls
✅ Statistics update after creating items
✅ Protected routes redirect when not authenticated
✅ Sign out clears authentication state

## Performance Checks

- [ ] API calls complete in < 2 seconds
- [ ] Loading indicators appear immediately
- [ ] UI remains responsive during API calls
- [ ] No memory leaks (check with React DevTools)
- [ ] No unnecessary re-renders

## Security Checks

- [ ] Bearer tokens stored securely (SecureStore on native)
- [ ] Tokens included in all authenticated requests
- [ ] Protected routes require authentication
- [ ] Sign out clears all tokens
- [ ] No sensitive data in console logs (production)

---

**All tests passing?** 🎉 Backend integration is complete!
