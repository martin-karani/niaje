import {
  ActionIcon,
  Alert,
  Box,
  Button,
  Card,
  Group,
  Image,
  Progress,
  ScrollArea,
  Stack,
  Text,
  useMantineTheme,
} from "@mantine/core";
import { Dropzone, DropzoneProps, FileWithPath } from "@mantine/dropzone";
import {
  IconAlertCircle,
  IconFile,
  IconFileCode,
  IconFileText,
  IconFileZip,
  IconPhoto,
  IconTrash,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";

// File types and their icons
const FILE_ICONS: Record<string, React.ReactNode> = {
  pdf: <IconFileText size="2rem" stroke={1.5} />,
  doc: <IconFileText size="2rem" stroke={1.5} />,
  docx: <IconFileText size="2rem" stroke={1.5} />,
  xls: <IconFileText size="2rem" stroke={1.5} />,
  xlsx: <IconFileText size="2rem" stroke={1.5} />,
  csv: <IconFileText size="2rem" stroke={1.5} />,
  txt: <IconFileText size="2rem" stroke={1.5} />,
  zip: <IconFileZip size="2rem" stroke={1.5} />,
  rar: <IconFileZip size="2rem" stroke={1.5} />,
  js: <IconFileCode size="2rem" stroke={1.5} />,
  ts: <IconFileCode size="2rem" stroke={1.5} />,
  jsx: <IconFileCode size="2rem" stroke={1.5} />,
  tsx: <IconFileCode size="2rem" stroke={1.5} />,
  jpg: <IconPhoto size="2rem" stroke={1.5} />,
  jpeg: <IconPhoto size="2rem" stroke={1.5} />,
  png: <IconPhoto size="2rem" stroke={1.5} />,
  gif: <IconPhoto size="2rem" stroke={1.5} />,
  svg: <IconPhoto size="2rem" stroke={1.5} />,
};

// Get file extension
function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

// Get file icon based on extension
function getFileIcon(fileName: string): React.ReactNode {
  const extension = getFileExtension(fileName);
  return FILE_ICONS[extension] || <IconFile size="2rem" stroke={1.5} />;
}

// Format file size
function formatFileSize(size: number): string {
  if (size < 1024) {
    return `${size} bytes`;
  } else if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  } else {
    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }
}

// Check if file is an image
function isImageFile(file: File): boolean {
  const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/svg+xml"];
  return imageTypes.includes(file.type);
}

// Generate URL for local preview
function generatePreviewUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    if (isImageFile(file)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      resolve("");
    }
  });
}

// File data structure
export interface FileData {
  file: File;
  preview?: string;
  status: "pending" | "uploading" | "success" | "error";
  progress?: number;
  error?: string;
}

export interface FileUploaderProps
  extends Partial<Omit<DropzoneProps, "onDrop">> {
  onFilesChange: (files: File[]) => void;
  value?: File[];
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  accept?: string[];
  label?: string;
  description?: string;
  error?: string;
  uploadUrl?: string;
  autoUpload?: boolean;
  showPreview?: boolean;
  previewsPerRow?: number;
  entityType?: string;
  entityId?: string;
  onUploadSuccess?: (response: any) => void;
  onUploadError?: (error: Error) => void;
}

export function FileUploader({
  onFilesChange,
  value = [],
  multiple = false,
  maxFiles = 5,
  maxSize = 5 * 1024 * 1024, // 5MB
  accept = [],
  label = "Upload files",
  description = "Drag files here or click to browse",
  error,
  uploadUrl,
  autoUpload = false,
  showPreview = true,
  previewsPerRow = 4,
  entityType,
  entityId,
  onUploadSuccess,
  onUploadError,
  ...props
}: FileUploaderProps) {
  const theme = useMantineTheme();
  const [files, setFiles] = useState<FileData[]>([]);

  // Initialize files from value
  useEffect(() => {
    if (value && value.length > 0) {
      Promise.all(
        value.map(async (file) => {
          const preview = isImageFile(file)
            ? await generatePreviewUrl(file)
            : undefined;
          return {
            file,
            preview,
            status: "success" as const,
          };
        })
      ).then((fileData) => {
        setFiles(fileData);
      });
    }
  }, []);

  // Handle file drop
  const handleDrop = async (droppedFiles: FileWithPath[]) => {
    // Limit to max files if needed
    const newFiles = [...files];

    const filesToAdd = multiple
      ? droppedFiles.slice(0, maxFiles - files.length)
      : [droppedFiles[0]];

    // Process each file
    const fileDataPromises = filesToAdd.map(async (file) => {
      const preview = isImageFile(file)
        ? await generatePreviewUrl(file)
        : undefined;
      return {
        file,
        preview,
        status: "pending" as const,
      };
    });

    const newFileData = await Promise.all(fileDataPromises);

    // If not multiple, replace existing files
    const updatedFiles = multiple ? [...newFiles, ...newFileData] : newFileData;

    setFiles(updatedFiles);
    onFilesChange(updatedFiles.map((f) => f.file));

    // Auto upload if enabled
    if (autoUpload && uploadUrl) {
      newFileData.forEach((fileData) => {
        uploadFile(fileData);
      });
    }
  };

  // Upload a file
  const uploadFile = async (fileData: FileData) => {
    if (!uploadUrl) return;

    // Update status to uploading
    const fileIndex = files.findIndex((f) => f.file === fileData.file);
    if (fileIndex === -1) return;

    const updatedFiles = [...files];
    updatedFiles[fileIndex] = { ...fileData, status: "uploading", progress: 0 };
    setFiles(updatedFiles);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", fileData.file);
      if (entityType) formData.append("entityType", entityType);
      if (entityId) formData.append("entityId", entityId);

      // Upload file with progress tracking
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          const progressUpdatedFiles = [...files];
          const currentIndex = progressUpdatedFiles.findIndex(
            (f) => f.file === fileData.file
          );
          if (currentIndex !== -1) {
            progressUpdatedFiles[currentIndex] = {
              ...progressUpdatedFiles[currentIndex],
              progress,
            };
            setFiles(progressUpdatedFiles);
          }
        }
      });

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          const finalFiles = [...files];
          const finalIndex = finalFiles.findIndex(
            (f) => f.file === fileData.file
          );

          if (finalIndex !== -1) {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              finalFiles[finalIndex] = {
                ...finalFiles[finalIndex],
                status: "success",
                progress: 100,
              };

              if (onUploadSuccess) {
                onUploadSuccess(response);
              }
            } else {
              finalFiles[finalIndex] = {
                ...finalFiles[finalIndex],
                status: "error",
                error: "Upload failed",
              };

              if (onUploadError) {
                onUploadError(new Error("Upload failed"));
              }
            }

            setFiles(finalFiles);
          }
        }
      };

      xhr.open("POST", uploadUrl, true);
      xhr.send(formData);
    } catch (error) {
      // Update status to error
      const errorFiles = [...files];
      const errorIndex = errorFiles.findIndex((f) => f.file === fileData.file);

      if (errorIndex !== -1) {
        errorFiles[errorIndex] = {
          ...errorFiles[errorIndex],
          status: "error",
          error: error.message || "Upload failed",
        };
        setFiles(errorFiles);
      }

      if (onUploadError) {
        onUploadError(error);
      }
    }
  };

  // Upload all pending files
  const uploadAllFiles = () => {
    if (!uploadUrl) return;

    files
      .filter((file) => file.status === "pending")
      .forEach((file) => {
        uploadFile(file);
      });
  };

  // Remove a file
  const removeFile = (fileToRemove: FileData) => {
    const updatedFiles = files.filter((file) => file !== fileToRemove);
    setFiles(updatedFiles);
    onFilesChange(updatedFiles.map((f) => f.file));
  };

  // Remove all files
  const removeAllFiles = () => {
    setFiles([]);
    onFilesChange([]);
  };

  // Calculate preview width based on previewsPerRow
  const previewWidth = `${100 / previewsPerRow}%`;

  return (
    <div>
      {label && (
        <Text size="sm" mb={5} fw={500}>
          {label}
        </Text>
      )}

      <Dropzone
        onDrop={handleDrop}
        maxSize={maxSize}
        accept={accept}
        multiple={multiple}
        {...props}
      >
        <Group
          position="center"
          spacing="xl"
          style={{ minHeight: 100, pointerEvents: "none" }}
        >
          <Dropzone.Accept>
            <IconUpload
              size="3rem"
              stroke={1.5}
              color={theme.colors[theme.primaryColor][4]}
            />
          </Dropzone.Accept>
          <Dropzone.Reject>
            <IconX size="3rem" stroke={1.5} color={theme.colors.red[6]} />
          </Dropzone.Reject>
          <Dropzone.Idle>
            <IconUpload size="3rem" stroke={1.5} />
          </Dropzone.Idle>

          <div>
            <Text size="xl" inline>
              {description}
            </Text>
            <Text size="sm" color="dimmed" inline mt={7}>
              {multiple ? `Attach up to ${maxFiles} files` : "Attach one file"}
              {maxSize && ` up to ${formatFileSize(maxSize)}`}
            </Text>
          </div>
        </Group>
      </Dropzone>

      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          color="red"
          title="Upload Error"
          mt="xs"
        >
          {error}
        </Alert>
      )}

      {files.length > 0 && (
        <>
          <Group position="apart" mt="md">
            <Text size="sm">
              {files.length} file{files.length !== 1 ? "s" : ""} selected
            </Text>

            <Group spacing="xs">
              {uploadUrl && files.some((file) => file.status === "pending") && (
                <Button size="xs" onClick={uploadAllFiles}>
                  Upload All
                </Button>
              )}
              <Button
                size="xs"
                color="red"
                variant="outline"
                onClick={removeAllFiles}
              >
                Remove All
              </Button>
            </Group>
          </Group>

          {showPreview && (
            <ScrollArea mt="md" h={300}>
              <Group grow align="flex-start">
                {files.map((fileData, index) => (
                  <Box key={index} w={previewWidth} p="xs">
                    <Card withBorder p="xs">
                      <Stack spacing="xs">
                        {isImageFile(fileData.file) && fileData.preview ? (
                          <Image
                            src={fileData.preview}
                            alt={fileData.file.name}
                            height={120}
                            fit="contain"
                          />
                        ) : (
                          <Card.Section py="md">
                            <Center>{getFileIcon(fileData.file.name)}</Center>
                          </Card.Section>
                        )}

                        <Text
                          size="xs"
                          lineClamp={1}
                          title={fileData.file.name}
                        >
                          {fileData.file.name}
                        </Text>

                        <Text size="xs" color="dimmed">
                          {formatFileSize(fileData.file.size)}
                        </Text>

                        {fileData.status === "uploading" &&
                          fileData.progress !== undefined && (
                            <Progress
                              value={fileData.progress}
                              size="sm"
                              color="blue"
                              striped
                              animate
                            />
                          )}

                        {fileData.status === "error" && (
                          <Text size="xs" color="red">
                            {fileData.error || "Upload failed"}
                          </Text>
                        )}

                        <Group position="right" spacing="xs">
                          {fileData.status === "pending" && uploadUrl && (
                            <ActionIcon
                              size="sm"
                              onClick={() => uploadFile(fileData)}
                            >
                              <IconUpload size="1rem" />
                            </ActionIcon>
                          )}

                          <ActionIcon
                            size="sm"
                            color="red"
                            onClick={() => removeFile(fileData)}
                          >
                            <IconTrash size="1rem" />
                          </ActionIcon>
                        </Group>
                      </Stack>
                    </Card>
                  </Box>
                ))}
              </Group>
            </ScrollArea>
          )}
        </>
      )}
    </div>
  );
}
