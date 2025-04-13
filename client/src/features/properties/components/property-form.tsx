import { Button } from "@/components/ui/button";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { z } from "zod";

// Validation schema for property form
const propertySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  address: z.string().min(5, "Address must be at least 5 characters"),
  type: z.string().min(2, "Type must be at least 2 characters"),
  description: z.string().optional(),
  caretakerId: z.string().optional().nullable(),
  agentId: z.string().optional().nullable(),
});

// Property form types
type PropertyFormData = z.infer<typeof propertySchema>;

interface PropertyFormProps {
  property?: any; // This would be the property object from the backend
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PropertyForm = ({
  property,
  onSuccess,
  onCancel,
}: PropertyFormProps) => {
  // Determine if we're editing or creating
  const isEditing = !!property;

  // Initialize form state
  const [formData, setFormData] = useState<PropertyFormData>({
    name: "",
    address: "",
    type: "Residential",
    description: "",
    caretakerId: null,
    agentId: null,
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users for assignment dropdowns
  const { getAll: getUsers, isLoading: usersLoading } = useUserManagement();
  const { data: usersData = [] } = getUsers({ role: "caretaker" });
  const { data: agentsData = [] } = getUsers({ role: "agent" });

  // tRPC hooks for creating/updating properties
  const { create, update } = useProperties();

  const {
    mutateAsync: createProperty,
    isLoading: isCreating,
    error: createError,
    reset: resetCreate,
  } = create;

  const {
    mutateAsync: updateProperty,
    isLoading: isUpdating,
    error: updateError,
    reset: resetUpdate,
  } = update;

  // Success message state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Populate form data if property is provided (edit mode)
  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || "",
        address: property.address || "",
        type: property.type || "Residential",
        description: property.description || "",
        caretakerId: property.caretakerId || null,
        agentId: property.agentId || null,
      });
    }
  }, [property]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value === "" ? null : value }));

    // Clear error for this field when user changes it
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    try {
      propertySchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as string;
          fieldErrors[path] = err.message;
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);

    if (!validateForm()) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditing) {
        // Update existing property
        await updateProperty({
          id: property.id,
          ...formData,
        });
        setSuccessMessage("Property updated successfully!");
      } else {
        // Create new property
        await createProperty(formData);
        setSuccessMessage("Property created successfully!");
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1500); // Give user time to see success message
      }
    } catch (error) {
      console.error("Error submitting property form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    if (isEditing) {
      // Reset to original property data
      setFormData({
        name: property.name || "",
        address: property.address || "",
        type: property.type || "Residential",
        description: property.description || "",
        caretakerId: property.caretakerId || null,
        agentId: property.agentId || null,
      });
    } else {
      // Reset to empty form
      setFormData({
        name: "",
        address: "",
        type: "Residential",
        description: "",
        caretakerId: null,
        agentId: null,
      });
    }
    setErrors({});
    resetCreate();
    resetUpdate();
    setSuccessMessage(null);
  };

  // Handle cancel button
  const handleCancel = () => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  };

  // Get the current error
  const errorMessage = createError?.message || updateError?.message;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 bg-destructive/10 text-destructive rounded-md flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="p-3 bg-emerald-100 text-emerald-800 rounded-md flex items-start gap-2">
          <Check className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <p>{successMessage}</p>
        </div>
      )}

      {/* Property Name */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">
          Property Name <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.name ? "border-destructive" : ""
          }`}
          placeholder="Enter property name"
        />
        {errors.name && (
          <p className="text-destructive text-sm">{errors.name}</p>
        )}
      </div>

      {/* Property Address */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">
          Address <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.address ? "border-destructive" : ""
          }`}
          placeholder="Enter property address"
        />
        {errors.address && (
          <p className="text-destructive text-sm">{errors.address}</p>
        )}
      </div>

      {/* Property Type */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">
          Property Type <span className="text-destructive">*</span>
        </label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 ${
            errors.type ? "border-destructive" : ""
          }`}
        >
          <option value="Residential">Residential</option>
          <option value="Commercial">Commercial</option>
          <option value="Industrial">Industrial</option>
          <option value="Land">Land</option>
          <option value="Mixed Use">Mixed Use</option>
        </select>
        {errors.type && (
          <p className="text-destructive text-sm">{errors.type}</p>
        )}
      </div>

      {/* Property Description */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Description</label>
        <textarea
          name="description"
          value={formData.description || ""}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Enter property description"
        />
      </div>

      {/* Caretaker */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Assign Caretaker</label>
        <select
          name="caretakerId"
          value={formData.caretakerId || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          disabled={usersLoading}
        >
          <option value="">None</option>
          {usersData.map((caretaker) => (
            <option key={caretaker.id} value={caretaker.id}>
              {caretaker.name}
            </option>
          ))}
        </select>
        {usersLoading && (
          <p className="text-sm text-muted-foreground">Loading caretakers...</p>
        )}
      </div>

      {/* Agent */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Assign Agent</label>
        <select
          name="agentId"
          value={formData.agentId || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
          disabled={usersLoading}
        >
          <option value="">None</option>
          {agentsData.map((agent) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
        {usersLoading && (
          <p className="text-sm text-muted-foreground">Loading agents...</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : isEditing ? (
            "Update Property"
          ) : (
            "Create Property"
          )}
        </Button>
      </div>
    </form>
  );
};

// Modal wrapper for the property form
export const PropertyFormModal = ({
  isOpen,
  onClose,
  property = null,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  property?: any;
  onSuccess?: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">
            {property ? "Edit Property" : "Add New Property"}
          </h2>
          <PropertyForm
            property={property}
            onSuccess={() => {
              if (onSuccess) onSuccess();
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};
