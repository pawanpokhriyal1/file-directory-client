import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  Breadcrumbs,
  Link,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Tooltip,
  Avatar,
  Divider
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CloudUpload as UploadIcon,
  Download as DownloadIcon,
  Home as HomeIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TextSnippet as TextIcon
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';
import { useSnackbar } from 'notistack';
const apiUrl = process.env.REACT_APP_API_URL;
const API_URL = `${apiUrl}/api/files`;

function FileExplorer() {
  const [currentFolder, setCurrentFolder] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [openFolderDialog, setOpenFolderDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editName, setEditName] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const { enqueueSnackbar } = useSnackbar();
  // Load root directory on mount
  useEffect(() => {
    loadRoot();
  }, []);

  const loadRoot = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/root`);
      setCurrentFolder(response.data);
      setBreadcrumbs([{ id: response.data._id, name: response.data.name }]);
    } catch (err) {
      console.error('Error loading root:', err);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = async (folderId) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/folder/${folderId}`);
      setCurrentFolder(response.data);
      
      // Update breadcrumbs
      const existingIndex = breadcrumbs.findIndex(crumb => crumb.id === response.data._id);
      const newCrumbs = existingIndex >= 0 
        ? breadcrumbs.slice(0, existingIndex + 1)
        : [...breadcrumbs, { id: response.data._id, name: response.data.name }];
      
      setBreadcrumbs(newCrumbs);
      setSelectedItem(null);
    } catch (err) {
      console.error('Error navigating to folder:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (acceptedFiles) => {
    if (!currentFolder || acceptedFiles.length === 0) return;
    
    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);
    formData.append('parentId', currentFolder._id);

    try {
      setUploadProgress(0);
      await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      });
      navigateToFolder(currentFolder._id);
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileUpload,
    noClick: true
  });

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    
    try {
      await axios.post(`${API_URL}/folder`, {
        name: newFolderName,
        parentId: currentFolder._id
      });
      setOpenFolderDialog(false);
      setNewFolderName('');
      enqueueSnackbar('Item created successfully', { variant: 'success' });

      navigateToFolder(currentFolder._id);
    } catch (err) {
      console.error('Error creating folder:', err);
      enqueueSnackbar('Failed to create item', { variant: 'error' });

    }
  };

  const handleRename = async () => {
    if (!editingItem || !editName.trim()) return;
    
    try {
      await axios.patch(`${API_URL}/rename/${editingItem._id}`, {
        name: editName
      });
      setOpenEditDialog(false);
      enqueueSnackbar('Item Rename successfully', { variant: 'success' });
      navigateToFolder(currentFolder._id);
    } catch (err) {
      console.error('Error renaming item:', err);
      enqueueSnackbar('Failed to rename item', { variant: 'error' });
    }
  };

  const handleDownload = async (fileId) => {
    try {
      window.open(`${API_URL}/download/${fileId}`, '_blank');
    } catch (err) {
      console.error('Error downloading file:', err);
    }
  };

  const handleDelete = async (itemId) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${API_URL}/delete/${itemId}`);
        enqueueSnackbar('Item deleted successfully', { variant: 'success' });
        navigateToFolder(currentFolder._id);
      } catch (err) {
        console.error('Delete error:', err);
        enqueueSnackbar('Failed to delete item', { variant: 'error' });
      }
    }
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('image')) return <ImageIcon color="primary" />;
    if (fileType === 'application/pdf') return <PdfIcon color="error" />;
    if (fileType?.includes('document') || fileType?.includes('msword')) return <DocIcon color="info" />;
    if (fileType === 'text/plain') return <TextIcon color="action" />;
    return <FileIcon color="secondary" />;
  };

  const formatDate = (dateString) => {
    return format(new Date(dateString), 'MMM dd, yyyy h:mm a');
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Main Content Area */}
      <Box
        {...getRootProps()}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <input {...getInputProps()} />
        
        {/* Header */}
        <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center', zIndex: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            File Explorer
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenFolderDialog(true)}
            sx={{ mr: 2 }}
          >
            New Folder
          </Button>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            component="label"
            color="secondary"
          >
            Upload
            <input
              type="file"
              hidden
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            />
          </Button>
        </Paper>

        {/* Breadcrumbs */}
        <Paper elevation={1} sx={{ p: 1.5, mb: 1 }}>
          <Breadcrumbs>
            {breadcrumbs.map((crumb, index) => (
              <Link
                key={crumb.id}
                color={index === breadcrumbs.length - 1 ? 'text.primary' : 'inherit'}
                underline="hover"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontWeight: index === breadcrumbs.length - 1 ? 'bold' : 'normal'
                }}
                onClick={() => navigateToFolder(crumb.id)}
              >
                {index === 0 ? <HomeIcon sx={{ mr: 0.5 }} /> : null}
                {crumb.name}
              </Link>
            ))}
          </Breadcrumbs>
        </Paper>

        {/* Upload Progress */}
        {uploadProgress > 0 && (
          <Box sx={{ width: '100%', mb: 1, px: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Uploading: {uploadProgress}%
            </Typography>
            <LinearProgress variant="determinate" value={uploadProgress} />
          </Box>
        )}

        {/* Drag & Drop Overlay */}
        {isDragActive && (
          <Paper
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 1000
            }}
          >
            <Typography variant="h4" color="white">
              Drop files here to upload
            </Typography>
          </Paper>
        )}

        {/* Content Area */}
        <Paper elevation={2} sx={{ flex: 1, overflow: 'auto', p: 2, position: 'relative' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Box sx={{ display: 'flex', height: '100%' }}>
                {/* File List */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  <List>
                    {currentFolder?.children?.length ? (
                      currentFolder.children.map((item) => (
                        <ListItem
                          key={item._id}
                          selected={selectedItem?._id === item._id}
                          onClick={() => {
                            if (item.isFolder) {
                              navigateToFolder(item._id);
                            } else {
                              setSelectedItem(item);
                            }
                          }}
                          sx={{
                            '&:hover': { backgroundColor: 'action.hover' },
                            borderRadius: 1,
                            mb: 0.5,
                            cursor: 'pointer'
                          }}
                          secondaryAction={
                            <Box>
                              <Tooltip title="Rename">
                                <IconButton
                                  edge="end"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingItem(item);
                                    setEditName(item.name);
                                    setOpenEditDialog(true);
                                  }}
                                  sx={{ mr: 1 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              {!item.isFolder && (
                                <Tooltip title="Download">
                                  <IconButton
                                    edge="end"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownload(item._id);
                                    }}
                                    sx={{ mr: 1 }}
                                  >
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Delete">
                                <IconButton
                                  edge="end"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(item._id);
                                  }}
                                >
                                  <DeleteIcon fontSize="small" color="error" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          }
                        >
                          <ListItemIcon>
                            {item.isFolder ? (
                              <FolderIcon color="primary" />
                            ) : (
                              getFileIcon(item.fileType)
                            )}
                          </ListItemIcon>
                          <ListItemText
                            primary={item.name}
                            secondary={
                              <>
                                {item.isFolder ? (
                                  <Typography variant="caption">
                                    {item.children.length} items • {formatDate(item.createdAt)}
                                  </Typography>
                                ) : (
                                  <Typography variant="caption">
                                    {item.formattedSize} • {formatDate(item.createdAt)}
                                  </Typography>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      <Typography sx={{ p: 2, color: 'text.secondary' }}>
                        This folder is empty
                      </Typography>
                    )}
                  </List>
                </Box>

                {/* Details Panel */}
                {selectedItem && (
                  <Paper elevation={2} sx={{ width: 300, ml: 2, p: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Details
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        {selectedItem.isFolder ? (
                          <FolderIcon />
                        ) : (
                          getFileIcon(selectedItem.fileType)
                        )}
                      </Avatar>
                      <Typography variant="subtitle1">{selectedItem.name}</Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Type
                      </Typography>
                      <Typography>
                        {selectedItem.isFolder ? 'Folder' : selectedItem.fileType}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Size
                      </Typography>
                      <Typography>
                        {selectedItem.isFolder 
                          ? `${selectedItem.children.length} items` 
                          : selectedItem.formattedSize}
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created
                      </Typography>
                      <Typography>
                        {formatDate(selectedItem.createdAt)}
                      </Typography>
                    </Box>

                    {!selectedItem.isFolder && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          startIcon={<DownloadIcon />}
                          fullWidth
                          onClick={() => handleDownload(selectedItem._id)}
                        >
                          Download
                        </Button>
                      </Box>
                    )}
                  </Paper>
                )}
              </Box>
            </>
          )}
        </Paper>
      </Box>

      {/* New Folder Dialog */}
      <Dialog open={openFolderDialog} onClose={() => setOpenFolderDialog(false)}>
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder Name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFolderDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateFolder} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>
          Rename {editingItem?.isFolder ? 'Folder' : 'File'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Name"
            fullWidth
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleRename()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleRename} color="primary">
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FileExplorer;