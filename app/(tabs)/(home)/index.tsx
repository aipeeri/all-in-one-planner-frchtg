
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { colors } from '@/constants/Colors';
import * as ImagePicker from 'expo-image-picker';
import { authenticatedGet, authenticatedPost, authenticatedPut, authenticatedDelete } from '@/utils/api';

interface Folder {
  id: string;
  name: string;
  type: string;
  color?: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

interface Note {
  id: string;
  folderId?: string;
  title: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  mediaCount?: number;
}

export default function NotesScreen() {
  console.log('NotesScreen: Rendering notes and studies screen');
  
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('NotesScreen: Component mounted, loading data');
    loadFolders();
    loadNotes();
  }, []);

  useEffect(() => {
    if (selectedFolder) {
      console.log('NotesScreen: Selected folder changed:', selectedFolder);
      loadNotes(selectedFolder);
    } else {
      loadNotes();
    }
  }, [selectedFolder]);

  const loadFolders = async () => {
    console.log('NotesScreen: Loading folders from API');
    try {
      const data = await authenticatedGet<Folder[]>('/api/folders?type=notes');
      console.log('NotesScreen: Loaded folders:', data);
      setFolders(data);
    } catch (error) {
      console.error('NotesScreen: Failed to load folders:', error);
      Alert.alert('Error', 'Failed to load folders. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadNotes = async (folderId?: string) => {
    console.log('NotesScreen: Loading notes from API', folderId ? `for folder ${folderId}` : 'all notes');
    try {
      const endpoint = folderId ? `/api/notes?folderId=${folderId}` : '/api/notes';
      const data = await authenticatedGet<Note[]>(endpoint);
      console.log('NotesScreen: Loaded notes:', data);
      setNotes(data);
    } catch (error) {
      console.error('NotesScreen: Failed to load notes:', error);
      Alert.alert('Error', 'Failed to load notes. Please try again.');
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) {
      Alert.alert('Error', 'Please enter a folder name');
      return;
    }
    console.log('NotesScreen: Creating new folder:', newFolderName);
    try {
      const newFolder = await authenticatedPost<Folder>('/api/folders', {
        name: newFolderName,
        type: 'notes',
      });
      console.log('NotesScreen: Created folder:', newFolder);
      setFolders([...folders, newFolder]);
      setNewFolderName('');
      setShowNewFolderModal(false);
      Alert.alert('Success', 'Folder created successfully!');
    } catch (error) {
      console.error('NotesScreen: Failed to create folder:', error);
      Alert.alert('Error', 'Failed to create folder. Please try again.');
    }
  };

  const createNote = async () => {
    if (!newNoteTitle.trim()) {
      Alert.alert('Error', 'Please enter a note title');
      return;
    }
    console.log('NotesScreen: Creating new note:', newNoteTitle);
    try {
      const noteData: any = {
        title: newNoteTitle,
        content: newNoteContent || '',
      };
      if (selectedFolder) {
        noteData.folderId = selectedFolder;
      }
      const newNote = await authenticatedPost<Note>('/api/notes', noteData);
      console.log('NotesScreen: Created note:', newNote);
      setNotes([newNote, ...notes]);
      setNewNoteTitle('');
      setNewNoteContent('');
      setShowNewNoteModal(false);
      Alert.alert('Success', 'Note created successfully!');
    } catch (error) {
      console.error('NotesScreen: Failed to create note:', error);
      Alert.alert('Error', 'Failed to create note. Please try again.');
    }
  };

  const pickImage = async () => {
    console.log('NotesScreen: User tapped pick image button');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      console.log('NotesScreen: Image/video selected:', result.assets[0].uri);
      Alert.alert('Info', 'Media upload will be available after creating the note. Create the note first, then you can add media to it.');
      // Note: Media upload requires a noteId, so it should be done after note creation
      // This would typically be implemented in a note detail/edit screen
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes & Studies</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            console.log('NotesScreen: User tapped add folder button');
            setShowNewFolderModal(true);
          }}
        >
          <IconSymbol
            ios_icon_name="folder.badge.plus"
            android_material_icon_name="create-new-folder"
            size={24}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Folders Section */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.foldersScroll}
        contentContainerStyle={styles.foldersContent}
      >
        <TouchableOpacity
          style={[
            styles.folderChip,
            !selectedFolder && styles.folderChipActive,
          ]}
          onPress={() => {
            console.log('NotesScreen: User selected all notes');
            setSelectedFolder(null);
          }}
        >
          <IconSymbol
            ios_icon_name="folder"
            android_material_icon_name="folder"
            size={20}
            color={!selectedFolder ? colors.backgroundAlt : colors.textSecondary}
          />
          <Text
            style={[
              styles.folderChipText,
              !selectedFolder && styles.folderChipTextActive,
            ]}
          >
            All Notes
          </Text>
        </TouchableOpacity>

        {folders.map((folder, index) => (
          <React.Fragment key={index}>
            <TouchableOpacity
              key={folder.id}
              style={[
                styles.folderChip,
                selectedFolder === folder.id && styles.folderChipActive,
              ]}
              onPress={() => {
                console.log('NotesScreen: User selected folder:', folder.name);
                setSelectedFolder(folder.id);
              }}
            >
              <IconSymbol
                ios_icon_name="folder.fill"
                android_material_icon_name="folder"
                size={20}
                color={
                  selectedFolder === folder.id
                    ? colors.backgroundAlt
                    : colors.textSecondary
                }
              />
              <Text
                style={[
                  styles.folderChipText,
                  selectedFolder === folder.id && styles.folderChipTextActive,
                ]}
              >
                {folder.name}
              </Text>
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </ScrollView>

      {/* Notes List */}
      <ScrollView
        style={styles.notesScroll}
        contentContainerStyle={styles.notesContent}
      >
        {notes.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol
              ios_icon_name="note.text"
              android_material_icon_name="description"
              size={64}
              color={colors.border}
            />
            <Text style={styles.emptyStateText}>No notes yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to create your first note
            </Text>
          </View>
        ) : (
          notes.map((note, index) => (
            <React.Fragment key={index}>
              <TouchableOpacity
                key={note.id}
                style={styles.noteCard}
                onPress={() => {
                  console.log('NotesScreen: User tapped note:', note.title);
                  Alert.alert('Note', note.content || 'No content');
                }}
              >
                <View style={styles.noteHeader}>
                  <Text style={styles.noteTitle}>{note.title}</Text>
                  {note.mediaCount && note.mediaCount > 0 && (
                    <View style={styles.mediaBadge}>
                      <IconSymbol
                        ios_icon_name="photo"
                        android_material_icon_name="image"
                        size={16}
                        color={colors.primary}
                      />
                      <Text style={styles.mediaBadgeText}>{note.mediaCount}</Text>
                    </View>
                  )}
                </View>
                {note.content && (
                  <Text style={styles.noteContent} numberOfLines={2}>
                    {note.content}
                  </Text>
                )}
                {note.tags && note.tags.length > 0 && (
                  <View style={styles.tagsContainer}>
                    {note.tags.map((tag, tagIndex) => (
                      <View key={tagIndex} style={styles.tag}>
                        <Text style={styles.tagText}>#{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={styles.noteDate}>
                  {new Date(note.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            </React.Fragment>
          ))
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          console.log('NotesScreen: User tapped add note button');
          setShowNewNoteModal(true);
        }}
      >
        <IconSymbol
          ios_icon_name="plus"
          android_material_icon_name="add"
          size={28}
          color={colors.backgroundAlt}
        />
      </TouchableOpacity>

      {/* New Folder Modal */}
      <Modal
        visible={showNewFolderModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewFolderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Folder</Text>
            <TextInput
              style={styles.input}
              placeholder="Folder name"
              placeholderTextColor={colors.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  console.log('NotesScreen: User cancelled folder creation');
                  setShowNewFolderModal(false);
                  setNewFolderName('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={createFolder}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New Note Modal */}
      <Modal
        visible={showNewNoteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNewNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>New Note</Text>
            <TextInput
              style={styles.input}
              placeholder="Note title"
              placeholderTextColor={colors.textSecondary}
              value={newNoteTitle}
              onChangeText={setNewNoteTitle}
              autoFocus
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Note content"
              placeholderTextColor={colors.textSecondary}
              value={newNoteContent}
              onChangeText={setNewNoteContent}
              multiline
              numberOfLines={4}
            />
            <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
              <IconSymbol
                ios_icon_name="photo"
                android_material_icon_name="image"
                size={20}
                color={colors.primary}
              />
              <Text style={styles.mediaButtonText}>Add Photo/Video</Text>
            </TouchableOpacity>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  console.log('NotesScreen: User cancelled note creation');
                  setShowNewNoteModal(false);
                  setNewNoteTitle('');
                  setNewNoteContent('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCreate]}
                onPress={createNote}
              >
                <Text style={styles.modalButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 48 : 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  addButton: {
    padding: 8,
  },
  foldersScroll: {
    maxHeight: 60,
  },
  foldersContent: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    gap: 8,
  },
  folderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
    gap: 6,
  },
  folderChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  folderChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  folderChipTextActive: {
    color: colors.backgroundAlt,
  },
  notesScroll: {
    flex: 1,
  },
  notesContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  noteCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.05)',
    elevation: 1,
  },
  noteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  noteTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  mediaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.highlight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  mediaBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  noteContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: colors.secondary,
    fontWeight: '500',
  },
  noteDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0px 4px 12px rgba(99, 102, 241, 0.4)',
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mediaButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalButtonCreate: {
    backgroundColor: colors.primary,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.backgroundAlt,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
});
