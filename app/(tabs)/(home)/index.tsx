
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
import { useRouter } from 'expo-router';

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
  console.log('NotesScreen: Rendering notes screen');
  
  const router = useRouter();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [showNoteDetail, setShowNoteDetail] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [newFolderName, setNewFolderName] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');
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
    } catch (error) {
      console.error('NotesScreen: Failed to create note:', error);
      Alert.alert('Error', 'Failed to create note. Please try again.');
    }
  };

  const updateNote = async () => {
    if (!selectedNote) return;
    console.log('NotesScreen: Updating note:', selectedNote.id);
    try {
      const updatedNote = await authenticatedPut<Note>(`/api/notes/${selectedNote.id}`, {
        title: editNoteTitle,
        content: editNoteContent,
      });
      console.log('NotesScreen: Updated note:', updatedNote);
      setNotes(notes.map(n => n.id === updatedNote.id ? updatedNote : n));
      setShowNoteDetail(false);
      setSelectedNote(null);
    } catch (error) {
      console.error('NotesScreen: Failed to update note:', error);
      Alert.alert('Error', 'Failed to update note. Please try again.');
    }
  };

  const deleteNote = async (noteId: string) => {
    console.log('NotesScreen: Deleting note:', noteId);
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await authenticatedDelete(`/api/notes/${noteId}`);
              console.log('NotesScreen: Deleted note:', noteId);
              setNotes(notes.filter(n => n.id !== noteId));
              setShowNoteDetail(false);
              setSelectedNote(null);
            } catch (error) {
              console.error('NotesScreen: Failed to delete note:', error);
              Alert.alert('Error', 'Failed to delete note. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openNoteDetail = (note: Note) => {
    console.log('NotesScreen: Opening note detail:', note.title);
    setSelectedNote(note);
    setEditNoteTitle(note.title);
    setEditNoteContent(note.content);
    setShowNoteDetail(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Notes</Text>
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
          <TouchableOpacity
            key={index}
            style={[
              styles.folderChip,
              selectedFolder === folder.id && styles.folderChipActive,
            ]}
            onPress={() => {
              console.log('NotesScreen: User selected folder:', folder.name);
              setSelectedFolder(folder.id);
            }}
          >
            <Text
              style={[
                styles.folderChipText,
                selectedFolder === folder.id && styles.folderChipTextActive,
              ]}
            >
              {folder.name}
            </Text>
          </TouchableOpacity>
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
              size={48}
              color={colors.border}
            />
            <Text style={styles.emptyStateText}>No notes yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Tap the + button to create your first note
            </Text>
          </View>
        ) : (
          notes.map((note, index) => (
            <TouchableOpacity
              key={index}
              style={styles.noteCard}
              onPress={() => openNoteDetail(note)}
            >
              <Text style={styles.noteTitle}>{note.title}</Text>
              {note.content && (
                <Text style={styles.noteContent} numberOfLines={2}>
                  {note.content}
                </Text>
              )}
              <Text style={styles.noteDate}>
                {new Date(note.createdAt).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
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
          size={24}
          color={colors.backgroundAlt}
        />
      </TouchableOpacity>

      {/* New Folder Modal */}
      <Modal
        visible={showNewFolderModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewFolderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Folder</Text>
              <TouchableOpacity onPress={() => setShowNewFolderModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Folder name"
              placeholderTextColor={colors.textSecondary}
              value={newFolderName}
              onChangeText={setNewFolderName}
              autoFocus
            />
            <TouchableOpacity style={styles.primaryButton} onPress={createFolder}>
              <Text style={styles.primaryButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* New Note Modal */}
      <Modal
        visible={showNewNoteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNewNoteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Note</Text>
              <TouchableOpacity onPress={() => setShowNewNoteModal(false)}>
                <IconSymbol
                  ios_icon_name="xmark"
                  android_material_icon_name="close"
                  size={24}
                  color={colors.text}
                />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Note title"
              placeholderTextColor={colors.textSecondary}
              value={newNoteTitle}
              onChangeText={setNewNoteTitle}
              autoFocus
            />
            <ScrollView style={styles.noteInputScroll}>
              <TextInput
                style={[styles.input, styles.largeTextArea]}
                placeholder="Start writing your note... (supports Apple Pencil)"
                placeholderTextColor={colors.textSecondary}
                value={newNoteContent}
                onChangeText={setNewNoteContent}
                multiline
                textAlignVertical="top"
              />
            </ScrollView>
            <TouchableOpacity style={styles.primaryButton} onPress={createNote}>
              <Text style={styles.primaryButtonText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Note Detail Modal */}
      <Modal
        visible={showNoteDetail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNoteDetail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContentLarge}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Note</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => selectedNote && deleteNote(selectedNote.id)}
                >
                  <IconSymbol
                    ios_icon_name="trash"
                    android_material_icon_name="delete"
                    size={22}
                    color={colors.error}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowNoteDetail(false)}>
                  <IconSymbol
                    ios_icon_name="xmark"
                    android_material_icon_name="close"
                    size={24}
                    color={colors.text}
                  />
                </TouchableOpacity>
              </View>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Note title"
              placeholderTextColor={colors.textSecondary}
              value={editNoteTitle}
              onChangeText={setEditNoteTitle}
            />
            <ScrollView style={styles.noteInputScroll}>
              <TextInput
                style={[styles.input, styles.largeTextArea]}
                placeholder="Note content (supports Apple Pencil)"
                placeholderTextColor={colors.textSecondary}
                value={editNoteContent}
                onChangeText={setEditNoteContent}
                multiline
                textAlignVertical="top"
              />
            </ScrollView>
            <TouchableOpacity style={styles.primaryButton} onPress={updateNote}>
              <Text style={styles.primaryButtonText}>Save Changes</Text>
            </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.5,
  },
  addButton: {
    padding: 8,
  },
  foldersScroll: {
    maxHeight: 60,
  },
  foldersContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  folderChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.backgroundAlt,
    marginRight: 8,
  },
  folderChipActive: {
    backgroundColor: colors.primary,
  },
  folderChipText: {
    fontSize: 14,
    fontWeight: '600',
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
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  noteCard: {
    backgroundColor: colors.backgroundAlt,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  noteTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 6,
  },
  noteContent: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '50%',
  },
  modalContentLarge: {
    backgroundColor: colors.backgroundAlt,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  deleteButton: {
    padding: 4,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.text,
    marginBottom: 12,
  },
  noteInputScroll: {
    flex: 1,
    marginBottom: 12,
  },
  largeTextArea: {
    minHeight: 400,
    textAlignVertical: 'top',
    fontSize: 17,
    lineHeight: 24,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.backgroundAlt,
  },
});
