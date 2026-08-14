import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  DOCUMENT_LABELS,
  DriverDocumentRecord,
  DriverDocumentType,
  fetchDriverDocuments,
  saveDriverDocument,
} from '../services/documentService';
import { pickDocumentImage, uploadDriverDocument } from '../services/cloudinaryService';
import { useDriverAuthStore } from '../store/authStore';
import { DriverStackParamList } from '../navigation/types';
import { fontFamilies } from '../theme/typography';
import { SafeAreaView } from 'react-native-safe-area-context';
import { moderateScale, heightScale } from '../utils/responsive';

type Props = NativeStackScreenProps<DriverStackParamList, 'DriverDocuments'>;

const REQUIRED_TYPES: DriverDocumentType[] = [
  'LICENSE',
  'NATIONAL_ID',
  'REGISTRATION_BOOK',
  'INSURANCE',
];

const DriverDocumentsScreen = ({ navigation }: Props) => {
  const { driverId, phone } = useDriverAuthStore();
  const driverRef = driverId || phone || '';
  const [documents, setDocuments] = useState<DriverDocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState<DriverDocumentType | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!driverRef) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetchDriverDocuments(driverRef);
      setDocuments(res.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [driverRef]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const getDoc = (type: DriverDocumentType) =>
    documents.find((doc) => doc.type === type);

  const handleUpload = async (type: DriverDocumentType) => {
    if (!driverRef || !phone) return;

    setUploadingType(type);
    setError(null);

    try {
      const picked = await pickDocumentImage();
      if (!picked) {
        setUploadingType(null);
        return;
      }

      const uploaded = await uploadDriverDocument(picked.uri, driverRef, picked.base64);
      await saveDriverDocument(driverRef, {
        type,
        url: uploaded.url,
        publicId: uploaded.publicId,
        phone,
      });
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingType(null);
    }
  };

  const uploadedCount = REQUIRED_TYPES.filter((type) => getDoc(type)).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Driver Documents</Text>
        <Text style={styles.subtitle}>
          Upload verification documents to Cloudinary. {uploadedCount}/{REQUIRED_TYPES.length} uploaded.
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {loading ? (
        <ActivityIndicator color="#FF5722" style={{ marginTop: 24 }} />
      ) : (
        REQUIRED_TYPES.map((type) => {
          const doc = getDoc(type);
          const isUploading = uploadingType === type;

          return (
            <View key={type} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{DOCUMENT_LABELS[type]}</Text>
                <Text style={[styles.status, doc ? styles.statusOk : styles.statusMissing]}>
                  {doc ? 'Uploaded' : 'Required'}
                </Text>
              </View>

              {doc?.url ? (
                <Image source={{ uri: doc.url }} style={styles.preview} resizeMode="cover" />
              ) : (
                <View style={styles.previewPlaceholder}>
                  <Text style={styles.previewPlaceholderText}>No file yet</Text>
                </View>
              )}

              <Pressable
                style={[styles.uploadBtn, isUploading && styles.uploadBtnDisabled]}
                onPress={() => handleUpload(type)}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.uploadBtnText}>{doc ? 'Replace document' : 'Upload document'}</Text>
                )}
              </Pressable>
            </View>
          );
        })
      )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
    padding: moderateScale(20),
  },
  header: { marginBottom: heightScale(16) },
  back: { fontSize: moderateScale(14), fontFamily: fontFamilies.bold, color: '#FF5722', marginBottom: heightScale(8) },
  title: { fontSize: moderateScale(24), fontFamily: fontFamilies.extrabold, color: '#1F2937' },
  subtitle: { fontSize: moderateScale(13), color: '#6B7280', marginTop: heightScale(6), lineHeight: moderateScale(20), fontFamily: fontFamilies.regular },
  error: { color: '#DC2626', marginBottom: heightScale(12), fontSize: moderateScale(13), fontFamily: fontFamilies.medium },
  card: {
    backgroundColor: '#FFF',
    borderRadius: moderateScale(16),
    padding: moderateScale(16),
    marginBottom: heightScale(14),
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: heightScale(10) },
  cardTitle: { fontSize: moderateScale(15), fontFamily: fontFamilies.extrabold, color: '#1F2937' },
  status: { fontSize: moderateScale(11), fontFamily: fontFamilies.bold, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusOk: { backgroundColor: '#D1FAE5', color: '#065F46' },
  statusMissing: { backgroundColor: '#FEF3C7', color: '#92400E' },
  preview: { width: '100%', height: heightScale(140), borderRadius: moderateScale(12), marginBottom: heightScale(12) },
  previewPlaceholder: {
    width: '100%',
    height: heightScale(100),
    borderRadius: moderateScale(12),
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: heightScale(12),
  },
  previewPlaceholderText: { color: '#9CA3AF', fontFamily: fontFamilies.semibold },
  uploadBtn: {
    backgroundColor: '#FF5722',
    borderRadius: moderateScale(12),
    paddingVertical: moderateScale(14),
    alignItems: 'center',
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { color: '#FFF', fontFamily: fontFamilies.extrabold, fontSize: moderateScale(14) },
});

export default DriverDocumentsScreen;
