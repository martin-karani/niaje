// client/src/components/properties/property-form.tsx
import { useCreateProperty, useUpdateProperty } from "@/api/trpc-hooks";
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

  // tRPC hooks for creating/updating properties
  const {
    createProperty,
    isLoading: isCreating,
    error: createError,
    successMessage: createSuccess,
    reset: resetCreate,
  } = useCreateProperty();
  const {
    updateProperty,
    isLoading: isUpdating,
    error: updateError,
    successMessage: updateSuccess,
    reset: resetUpdate,
  } = useUpdateProperty();

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
    setFormData((prev) => ({ ...prev, [name]: value }));

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
      } else {
        // Create new property
        await createProperty(formData);
      }

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
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
  };

  // Handle cancel button
  const handleCancel = () => {
    resetForm();
    if (onCancel) {
      onCancel();
    }
  };

  // Get the current error or success message
  const errorMessage = createError || updateError;
  const successMessage = createSuccess || updateSuccess;
  const isLoading = isCreating || isUpdating || isSubmitting;

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

      {/* Caretaker (This would be a dropdown populated from users with caretaker role) */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Assign Caretaker</label>
        <select
          name="caretakerId"
          value={formData.caretakerId || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">None</option>
          <option value="1">John Smith</option>
          <option value="2">Sarah Johnson</option>
          <option value="3">Michael Brown</option>
        </select>
      </div>

      {/* Agent (This would be a dropdown populated from users with agent role) */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Assign Agent</label>
        <select
          name="agentId"
          value={formData.agentId || ""}
          onChange={handleChange}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="">None</option>
          <option value="4">Emily Davis</option>
          <option value="5">Robert Wilson</option>
          <option value="6">Laura Martin</option>
        </select>
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
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
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
