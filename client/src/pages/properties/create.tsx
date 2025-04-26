import {
  ActionIcon,
  Box,
  Button,
  Card,
  Container,
  Divider,
  FileInput,
  Grid,
  Group,
  NumberInput,
  Paper,
  Select,
  SimpleGrid,
  Switch,
  Tabs,
  Text,
  Textarea,
  TextInput,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconBuilding,
  IconBuildingSkyscraper,
  IconCalendar,
  IconCheck,
  IconDeviceFloppy,
  IconFileUpload,
  IconMapPin,
  IconPhoto,
  IconPlus,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { PageHeader } from "../../components/common/page-header";
import { useAuthStore } from "../../state/auth-store";

// Mock data for dropdowns
const propertyTypes = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use", label: "Mixed Use" },
  { value: "land", label: "Land" },
];

const propertyStatuses = [
  { value: "active", label: "Active" },
  { value: "under_construction", label: "Under Construction" },
  { value: "inactive", label: "Inactive" },
  { value: "sold", label: "Sold" },
];

const states = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
];

const countries = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "AU", label: "Australia" },
];

// Mock data for amenities
const amenitiesOptions = [
  { value: "elevator", label: "Elevator" },
  { value: "parking", label: "Parking" },
  { value: "gym", label: "Fitness Center" },
  { value: "pool", label: "Swimming Pool" },
  { value: "security", label: "Security System" },
  { value: "laundry", label: "Laundry Facilities" },
  { value: "air_conditioning", label: "Air Conditioning" },
  { value: "heating", label: "Central Heating" },
  { value: "pet_friendly", label: "Pet Friendly" },
  { value: "furnished", label: "Furnished" },
  { value: "rooftop", label: "Rooftop Access" },
  { value: "garden", label: "Garden/Yard" },
  { value: "doorman", label: "Doorman" },
  { value: "storage", label: "Storage Units" },
  { value: "package_room", label: "Package Room" },
  { value: "bike_storage", label: "Bike Storage" },
];

// Mock data for property owners/caretakers
const owners = [
  { value: "o1", label: "Alpha Investments LLC" },
  { value: "o2", label: "Beta Commercial Holdings" },
  { value: "o3", label: "Gamma Properties Inc" },
  { value: "o4", label: "Delta Retail Management" },
];

const caretakers = [
  { value: "c1", label: "John Smith" },
  { value: "c2", label: "Maria Rodriguez" },
  { value: "c3", label: "David Chen" },
  { value: "c4", label: "Sarah Johnson" },
];

// Mock property data for edit mode
const existingProperty = {
  id: "1",
  name: "Sunset Apartments",
  addressLine1: "123 Main Street",
  addressLine2: "Unit A",
  city: "San Francisco",
  state: "CA",
  postalCode: "94105",
  country: "US",
  type: "residential",
  status: "active",
  description:
    "A modern apartment complex with 24 units located in the heart of the city. Features include a rooftop garden, community room, and secure parking. The building was renovated in 2020 with all new appliances and finishes.",
  yearBuilt: 1995,
  lastRenovated: 2020,
  numberOfUnits: 24,
  amenities: [
    "elevator",
    "parking",
    "gym",
    "air_conditioning",
    "heating",
    "pet_friendly",
    "rooftop",
    "garden",
  ],
  ownerId: "o1",
  caretakerId: "c1",
  notes:
    "Building has good history of occupancy. Upgraded all common areas in 2020. Roof warranty valid until 2030.",
  images: [
    "https://images.unsplash.com/photo-1580041065738-e72023775cdc?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
  ],
};

const PropertyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, organization } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [isEditMode, setIsEditMode] = useState(!!id);
  const [previewImages, setPreviewImages] = useState([]);
  const [propertyDocuments, setPropertyDocuments] = useState([]);
  const [utilityMeters, setUtilityMeters] = useState([
    {
      id: 1,
      type: "electricity",
      number: "E-12345678",
      notes: "Main building electricity",
    },
    { id: 2, type: "water", number: "W-87654321", notes: "Main water meter" },
    { id: 3, type: "gas", number: "G-45678912", notes: "Heating system" },
  ]);

  // Form with validation
  const form = useForm({
    initialValues: {
      name: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "US",
      type: "residential",
      status: "active",
      description: "",
      yearBuilt: new Date().getFullYear() - 10,
      lastRenovated: new Date().getFullYear(),
      numberOfUnits: 1,
      amenities: [],
      ownerId: "",
      caretakerId: "",
      notes: "",
      images: [],
      isTracingUtilities: false,
    },
    validate: {
      name: (value) =>
        value.length < 2 ? "Name must be at least 2 characters" : null,
      addressLine1: (value) =>
        value.length < 3 ? "Address must be at least 3 characters" : null,
      city: (value) => (value.length < 2 ? "City is required" : null),
      state: (value) => (!value ? "State is required" : null),
      postalCode: (value) => {
        if (!value) return "Postal code is required";
        if (!/^\d{5}(-\d{4})?$/.test(value) && form.values.country === "US")
          return "Invalid US postal code format";
        return null;
      },
      ownerId: (value) => (!value ? "Property owner is required" : null),
      yearBuilt: (value) => {
        if (!value) return "Year built is required";
        const currentYear = new Date().getFullYear();
        if (value < 1800 || value > currentYear)
          return `Year must be between 1800 and ${currentYear}`;
        return null;
      },
    },
  });

  // Load existing property data for edit mode
  useEffect(() => {
    if (isEditMode) {
      setIsFetching(true);
      // Simulate API call to fetch property data
      setTimeout(() => {
        form.setValues({
          name: existingProperty.name,
          addressLine1: existingProperty.addressLine1,
          addressLine2: existingProperty.addressLine2 || "",
          city: existingProperty.city,
          state: existingProperty.state,
          postalCode: existingProperty.postalCode,
          country: existingProperty.country,
          type: existingProperty.type,
          status: existingProperty.status,
          description: existingProperty.description,
          yearBuilt: existingProperty.yearBuilt,
          lastRenovated: existingProperty.lastRenovated,
          numberOfUnits: existingProperty.numberOfUnits,
          amenities: existingProperty.amenities,
          ownerId: existingProperty.ownerId,
          caretakerId: existingProperty.caretakerId || "",
          notes: existingProperty.notes || "",
          isTracingUtilities: true,
        });
        setPreviewImages(
          existingProperty.images.map((url, index) => ({
            id: index + 1,
            url,
            file: null,
          }))
        );
        setIsFetching(false);
      }, 1000);
    }
  }, [isEditMode, id]);

  // Handle image uploads
  const handleImageChange = (files) => {
    if (!files || !files.length) return;

    const newFiles = Array.from(files).map((file, index) => ({
      id: previewImages.length + index + 1,
      url: URL.createObjectURL(file),
      file: file,
    }));

    setPreviewImages([...previewImages, ...newFiles]);
  };

  // Remove an image
  const removeImage = (imageId) => {
    setPreviewImages(previewImages.filter((img) => img.id !== imageId));
  };

  // Handle document uploads
  const handleDocumentChange = (files) => {
    if (!files || !files.length) return;

    const newFiles = Array.from(files).map((file, index) => ({
      id: propertyDocuments.length + index + 1,
      name: file.name,
      type: file.type,
      size: file.size,
      file: file,
      uploadDate: new Date().toISOString(),
    }));

    setPropertyDocuments([...propertyDocuments, ...newFiles]);
  };

  // Remove a document
  const removeDocument = (documentId) => {
    setPropertyDocuments(
      propertyDocuments.filter((doc) => doc.id !== documentId)
    );
  };

  // Add a utility meter
  const addUtilityMeter = () => {
    const newId = utilityMeters.length
      ? Math.max(...utilityMeters.map((u) => u.id)) + 1
      : 1;
    setUtilityMeters([
      ...utilityMeters,
      {
        id: newId,
        type: "electricity",
        number: "",
        notes: "",
      },
    ]);
  };

  // Update a utility meter
  const updateUtilityMeter = (id, field, value) => {
    setUtilityMeters(
      utilityMeters.map((meter) =>
        meter.id === id ? { ...meter, [field]: value } : meter
      )
    );
  };

  // Remove a utility meter
  const removeUtilityMeter = (id) => {
    setUtilityMeters(utilityMeters.filter((meter) => meter.id !== id));
  };

  // Form submission handler
  const handleSubmit = (values) => {
    setIsLoading(true);

    // Prepare data for submission
    const formData = {
      ...values,
      organizationId: organization.id,
      // Convert images from preview objects to actual files for upload
      imageFiles: previewImages.map((img) => img.file).filter((file) => file),
      documents: propertyDocuments.map((doc) => doc.file),
      utilities: form.values.isTracingUtilities ? utilityMeters : [],
    };

    // Simulate API call
    setTimeout(() => {
      console.log("Submitting form data:", formData);

      notifications.show({
        title: isEditMode ? "Property Updated" : "Property Created",
        message: isEditMode
          ? `${values.name} has been updated successfully!`
          : `${values.name} has been added to your portfolio!`,
        color: "green",
        icon: <IconCheck size={16} />,
      });

      navigate("/properties");
      setIsLoading(false);
    }, 1500);
  };

  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <Container size="lg" mt="md">
      <PageHeader
        title={isEditMode ? `Edit ${form.values.name}` : "Add New Property"}
        subtitle={
          isEditMode
            ? `Update details for ${form.values.name}`
            : `Add a new property to ${organization?.name || "your portfolio"}`
        }
        breadcrumbs={[
          { title: "Dashboard", href: "/dashboard" },
          { title: "Properties", href: "/properties" },
          { title: isEditMode ? "Edit Property" : "Add Property" },
        ]}
        backButton={{
          label: "Back to Properties",
          href: "/properties",
        }}
      />

      <Paper withBorder shadow="sm" radius="md" p="xl" mt="md">
        {isFetching ? (
          <div>Loading property data...</div>
        ) : (
          <form onSubmit={form.onSubmit(handleSubmit)}>
            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List mb="md">
                <Tabs.Tab value="general" icon={<IconBuilding size={14} />}>
                  General
                </Tabs.Tab>
                <Tabs.Tab value="features" icon={<IconCheck size={14} />}>
                  Features & Amenities
                </Tabs.Tab>
                <Tabs.Tab value="images" icon={<IconPhoto size={14} />}>
                  Images
                </Tabs.Tab>
                <Tabs.Tab value="documents" icon={<IconFileUpload size={14} />}>
                  Documents
                </Tabs.Tab>
                <Tabs.Tab
                  value="utilities"
                  icon={<IconBuildingSkyscraper size={14} />}
                >
                  Utilities
                </Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="general">
                <Grid gutter="md">
                  <Grid.Col span={12}>
                    <TextInput
                      required
                      label="Property Name"
                      placeholder="Enter property name"
                      {...form.getInputProps("name")}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Divider label="Location" labelPosition="center" mb="md" />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <TextInput
                      required
                      label="Address Line 1"
                      placeholder="Enter street address"
                      icon={<IconMapPin size={16} />}
                      {...form.getInputProps("addressLine1")}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <TextInput
                      label="Address Line 2"
                      placeholder="Apt, Suite, Building, etc. (optional)"
                      {...form.getInputProps("addressLine2")}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      required
                      label="City"
                      placeholder="City"
                      {...form.getInputProps("city")}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <Select
                      required
                      label="State/Province"
                      placeholder="Select state"
                      data={states}
                      searchable
                      maxDropdownHeight={280}
                      {...form.getInputProps("state")}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                    <TextInput
                      required
                      label="Postal Code"
                      placeholder="Postal code"
                      {...form.getInputProps("postalCode")}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      required
                      label="Country"
                      placeholder="Select country"
                      data={countries}
                      searchable
                      defaultValue="US"
                      {...form.getInputProps("country")}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Divider
                      label="Property Details"
                      labelPosition="center"
                      mb="md"
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      required
                      label="Property Type"
                      placeholder="Select property type"
                      data={propertyTypes}
                      {...form.getInputProps("type")}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      required
                      label="Status"
                      placeholder="Select status"
                      data={propertyStatuses}
                      {...form.getInputProps("status")}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <NumberInput
                      required
                      label="Year Built"
                      placeholder="Year of construction"
                      min={1800}
                      max={new Date().getFullYear()}
                      icon={<IconCalendar size={16} />}
                      {...form.getInputProps("yearBuilt")}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <NumberInput
                      label="Last Renovated"
                      placeholder="Year of last renovation"
                      min={1800}
                      max={new Date().getFullYear()}
                      icon={<IconCalendar size={16} />}
                      {...form.getInputProps("lastRenovated")}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <NumberInput
                      required
                      label="Number of Units"
                      placeholder="Enter total units"
                      min={1}
                      icon={<IconBuilding size={16} />}
                      {...form.getInputProps("numberOfUnits")}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Textarea
                      label="Description"
                      placeholder="Enter property description"
                      minRows={4}
                      {...form.getInputProps("description")}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Divider
                      label="Management"
                      labelPosition="center"
                      mb="md"
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      required
                      label="Property Owner"
                      placeholder="Select property owner"
                      data={owners}
                      searchable
                      withAsterisk
                      {...form.getInputProps("ownerId")}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      label="Caretaker"
                      placeholder="Select caretaker (optional)"
                      data={caretakers}
                      searchable
                      clearable
                      {...form.getInputProps("caretakerId")}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <Textarea
                      label="Additional Notes"
                      placeholder="Enter any additional notes about the property"
                      minRows={3}
                      {...form.getInputProps("notes")}
                    />
                  </Grid.Col>
                </Grid>
              </Tabs.Panel>

              <Tabs.Panel value="features">
                <Box mb="xl">
                  <Text fw={500} mb="md">
                    Select Property Amenities
                  </Text>
                  <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                    {amenitiesOptions.map((option) => (
                      <Card key={option.value} withBorder p="sm" radius="md">
                        <Group position="apart">
                          <Text>{option.label}</Text>
                          <Switch
                            checked={form.values.amenities.includes(
                              option.value
                            )}
                            onChange={(event) => {
                              const checked = event.currentTarget.checked;
                              const currentAmenities = [
                                ...form.values.amenities,
                              ];

                              if (checked) {
                                if (!currentAmenities.includes(option.value)) {
                                  currentAmenities.push(option.value);
                                }
                              } else {
                                const index = currentAmenities.indexOf(
                                  option.value
                                );
                                if (index > -1) {
                                  currentAmenities.splice(index, 1);
                                }
                              }

                              form.setFieldValue("amenities", currentAmenities);
                            }}
                          />
                        </Group>
                      </Card>
                    ))}
                  </SimpleGrid>
                </Box>
              </Tabs.Panel>

              <Tabs.Panel value="images">
                <Box mb="xl">
                  <Text fw={500} mb="md">
                    Property Images
                  </Text>

                  <FileInput
                    label="Upload Images"
                    placeholder="Click to upload or drag and drop"
                    accept="image/png,image/jpeg,image/webp"
                    multiple
                    onChange={handleImageChange}
                    icon={<IconPhoto size={16} />}
                    mb="md"
                  />

                  {previewImages.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
                      {previewImages.map((image) => (
                        <Card key={image.id} withBorder p="xs" radius="md">
                          <Card.Section>
                            <Image
                              src={image.url}
                              height={160}
                              alt="Property image"
                            />
                          </Card.Section>
                          <Group position="apart" mt="xs">
                            <Text size="sm" truncate>
                              {image.file
                                ? image.file.name
                                : `Image ${image.id}`}
                            </Text>
                            <ActionIcon
                              color="red"
                              onClick={() => removeImage(image.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Card>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Text color="dimmed" align="center">
                      No images uploaded yet. Upload images to showcase the
                      property.
                    </Text>
                  )}
                </Box>
              </Tabs.Panel>

              <Tabs.Panel value="documents">
                <Box mb="xl">
                  <Text fw={500} mb="md">
                    Property Documents
                  </Text>

                  <FileInput
                    label="Upload Documents"
                    placeholder="Upload property documents (deeds, certificates, etc.)"
                    accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                    multiple
                    onChange={handleDocumentChange}
                    icon={<IconFileUpload size={16} />}
                    mb="md"
                  />

                  {propertyDocuments.length > 0 ? (
                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                      {propertyDocuments.map((doc) => (
                        <Card key={doc.id} withBorder p="sm" radius="md">
                          <Group position="apart">
                            <div>
                              <Text fw={500}>{doc.name}</Text>
                              <Text size="xs" color="dimmed">
                                {formatFileSize(doc.size)} • Uploaded:{" "}
                                {new Date(doc.uploadDate).toLocaleDateString()}
                              </Text>
                            </div>
                            <ActionIcon
                              color="red"
                              onClick={() => removeDocument(doc.id)}
                            >
                              <IconTrash size={16} />
                            </ActionIcon>
                          </Group>
                        </Card>
                      ))}
                    </SimpleGrid>
                  ) : (
                    <Text color="dimmed" align="center">
                      No documents uploaded yet. Upload important property
                      documents for record keeping.
                    </Text>
                  )}
                </Box>
              </Tabs.Panel>

              <Tabs.Panel value="utilities">
                <Box mb="xl">
                  <Group position="apart" mb="md">
                    <Text fw={500}>Utility Meters</Text>
                    <Switch
                      label="Track Utilities"
                      checked={form.values.isTracingUtilities}
                      onChange={(event) =>
                        form.setFieldValue(
                          "isTracingUtilities",
                          event.currentTarget.checked
                        )
                      }
                    />
                  </Group>

                  {form.values.isTracingUtilities ? (
                    <>
                      <SimpleGrid
                        cols={{ base: 1, sm: 1 }}
                        spacing="md"
                        mb="md"
                      >
                        {utilityMeters.map((meter) => (
                          <Card key={meter.id} withBorder p="sm" radius="md">
                            <Grid gutter="md">
                              <Grid.Col span={{ base: 12, sm: 4 }}>
                                <Select
                                  label="Utility Type"
                                  value={meter.type}
                                  onChange={(value) =>
                                    updateUtilityMeter(meter.id, "type", value)
                                  }
                                  data={[
                                    {
                                      value: "electricity",
                                      label: "Electricity",
                                    },
                                    { value: "water", label: "Water" },
                                    { value: "gas", label: "Gas" },
                                    { value: "internet", label: "Internet" },
                                    { value: "trash", label: "Trash" },
                                    { value: "other", label: "Other" },
                                  ]}
                                />
                              </Grid.Col>
                              <Grid.Col span={{ base: 12, sm: 4 }}>
                                <TextInput
                                  label="Meter/Account Number"
                                  value={meter.number}
                                  onChange={(event) =>
                                    updateUtilityMeter(
                                      meter.id,
                                      "number",
                                      event.currentTarget.value
                                    )
                                  }
                                  placeholder="Enter meter or account number"
                                />
                              </Grid.Col>
                              <Grid.Col span={{ base: 12, sm: 4 }}>
                                <TextInput
                                  label="Notes"
                                  value={meter.notes}
                                  onChange={(event) =>
                                    updateUtilityMeter(
                                      meter.id,
                                      "notes",
                                      event.currentTarget.value
                                    )
                                  }
                                  placeholder="Optional notes"
                                  rightSection={
                                    <ActionIcon
                                      color="red"
                                      onClick={() =>
                                        removeUtilityMeter(meter.id)
                                      }
                                    >
                                      <IconTrash size={16} />
                                    </ActionIcon>
                                  }
                                />
                              </Grid.Col>
                            </Grid>
                          </Card>
                        ))}
                      </SimpleGrid>

                      <Button
                        leftSection={<IconPlus size={16} />}
                        variant="outline"
                        onClick={addUtilityMeter}
                      >
                        Add Utility Meter
                      </Button>
                    </>
                  ) : (
                    <Text color="dimmed" align="center">
                      Enable utility tracking to manage meters and utility
                      accounts for this property.
                    </Text>
                  )}
                </Box>
              </Tabs.Panel>
            </Tabs>

            <Group position="right" mt="xl">
              <Button
                component={Link}
                to="/properties"
                variant="outline"
                color="gray"
                leftSection={<IconX size={16} />}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                leftSection={<IconDeviceFloppy size={16} />}
                loading={isLoading}
              >
                {isEditMode ? "Update Property" : "Create Property"}
              </Button>
            </Group>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default PropertyForm;
