import { useState, useEffect } from "react";

interface User {
  rollNumber: string;
  name: string;
}

interface FormField {
  fieldId: string;
  type:
    | "text"
    | "tel"
    | "email"
    | "textarea"
    | "date"
    | "dropdown"
    | "radio"
    | "checkbox";
  label: string;
  placeholder?: string;
  required: boolean;
  dataTestId: string;
  validation?: {
    message: string;
  };
  options?: Array<{
    value: string;
    label: string;
    dataTestId?: string;
  }>;
  maxLength?: number;
  minLength?: number;
}

interface FormSection {
  sectionId: number;
  title: string;
  description: string;
  fields: FormField[];
}

interface FormData {
  formTitle: string;
  formId: string;
  version: string;
  sections: FormSection[];
}

interface FormResponse {
  message: string;
  form: FormData;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User>({ rollNumber: "", name: "" });
  const [formData, setFormData] = useState<FormData | null>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Create user API call
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLoginError("");

    try {
      const response = await fetch(
        "https://dynamic-form-generator-9rl7.onrender.com/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rollNumber: user.rollNumber,
            name: user.name,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to login");
      }

      setIsLoggedIn(true);
      fetchForm();
    } catch (error) {
      console.error("Login error:", error);
      setLoginError(error instanceof Error ? error.message : "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch form structure API call
  const fetchForm = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://dynamic-form-generator-9rl7.onrender.com/get-form?rollNumber=${user.rollNumber}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch form data");
      }

      const data: FormResponse = await response.json();
      setFormData(data.form);

      // Initialize form values with empty strings
      const initialValues: Record<string, any> = {};
      data.form.sections.forEach((section) => {
        section.fields.forEach((field) => {
          if (field.type === "checkbox") {
            initialValues[field.fieldId] = false;
          } else {
            initialValues[field.fieldId] = "";
          }
        });
      });

      setFormValues(initialValues);
    } catch (error) {
      console.error("Error fetching form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));

    // Clear error when user types
    if (errors[fieldId]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[fieldId];
        return updated;
      });
    }
  };

  // Validate a single field
  const validateField = (field: FormField, value: any): string => {
    if (
      field.required &&
      (value === "" || value === undefined || value === null)
    ) {
      return field.validation?.message || "This field is required";
    }

    if (typeof value === "string") {
      if (field.minLength && value.length < field.minLength) {
        return `Minimum ${field.minLength} characters required`;
      }

      if (field.maxLength && value.length > field.maxLength) {
        return `Maximum ${field.maxLength} characters allowed`;
      }
    }

    if (field.type === "email" && value && !/\S+@\S+\.\S+/.test(value)) {
      return "Please enter a valid email address";
    }

    if (field.type === "tel" && value && !/^\d{10}$/.test(value)) {
      return "Please enter a valid 10-digit phone number";
    }

    return "";
  };

  // Validate current section
  const validateSection = (sectionIndex: number): boolean => {
    if (!formData) return false;

    const currentSectionData = formData.sections[sectionIndex];
    const newErrors: Record<string, string> = {};
    let isValid = true;

    currentSectionData.fields.forEach((field) => {
      const errorMessage = validateField(field, formValues[field.fieldId]);
      if (errorMessage) {
        newErrors[field.fieldId] = errorMessage;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    const isValid = validateSection(currentSection);

    if (isValid && formData) {
      if (currentSection < formData.sections.length - 1) {
        setCurrentSection(currentSection + 1);
      }
    }
  };

  const handlePrev = () => {
    if (currentSection > 0) {
      setCurrentSection(currentSection - 1);
    }
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isValid = validateSection(currentSection);

    if (isValid) {
      console.log("Form Data Submitted:", formValues);
    }
  };

  // Render input field based on type
  const renderField = (field: FormField) => {
    switch (field.type) {
      case "text":
      case "email":
      case "tel":
      case "date":
        return (
          <input
            type={field.type}
            id={field.fieldId}
            data-testid={field.dataTestId}
            value={formValues[field.fieldId] || ""}
            onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
            placeholder={field.placeholder}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              marginTop: "8px",
              fontSize: "14px",
            }}
            maxLength={field.maxLength}
          />
        );
      case "textarea":
        return (
          <textarea
            id={field.fieldId}
            data-testid={field.dataTestId}
            value={formValues[field.fieldId] || ""}
            onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
            placeholder={field.placeholder}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              fontSize: "14px",
              marginTop: "8px",
            }}
            maxLength={field.maxLength}
          />
        );
      case "dropdown":
        return (
          <select
            id={field.fieldId}
            data-testid={field.dataTestId}
            value={formValues[field.fieldId] || ""}
            onChange={(e) => handleInputChange(field.fieldId, e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "5px",
              border: "1px solid #ddd",
              fontSize: "14px",
              marginTop: "8px",
            }}
          >
            <option value="">Select an option</option>
            {field.options?.map((option) => (
              <option
                key={option.value}
                value={option.value}
                data-testid={option.dataTestId}
              >
                {option.label}
              </option>
            ))}
          </select>
        );
      case "radio":
        return (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {field.options?.map((option) => (
              <div
                key={option.value}
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginTop: "8px",
                }}
              >
                <input
                  type="radio"
                  id={`${field.fieldId}-${option.value}`}
                  name={field.fieldId}
                  value={option.value}
                  data-testid={option.dataTestId}
                  checked={formValues[field.fieldId] === option.value}
                  onChange={() =>
                    handleInputChange(field.fieldId, option.value)
                  }
                  style={{ marginRight: "8px" }}
                />
                <label htmlFor={`${field.fieldId}-${option.value}`}>
                  {option.label}
                </label>
              </div>
            ))}
          </div>
        );
      case "checkbox":
        return (
          <div
            style={{ display: "flex", alignItems: "center", marginTop: "8px" }}
          >
            <input
              type="checkbox"
              id={field.fieldId}
              data-testid={field.dataTestId}
              checked={formValues[field.fieldId] || false}
              onChange={(e) =>
                handleInputChange(field.fieldId, e.target.checked)
              }
              style={{ marginRight: "8px" }}
            />
            <label htmlFor={field.fieldId}>{field.label}</label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f9fafb",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: "450px",
          width: "100%",
          backgroundColor: "#fff",
          borderRadius: "12px",
          boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
          padding: "30px",
          textAlign: "center",
        }}
      >
        {!isLoggedIn ? (
          <div>
            <h2
              style={{
                fontSize: "26px",
                fontWeight: "bold",
                color: "#333",
                marginBottom: "20px",
              }}
            >
              Student Login
            </h2>
            {loginError && (
              <div
                style={{
                  backgroundColor: "#ffdddd",
                  color: "#b30000",
                  padding: "12px",
                  borderRadius: "8px",
                  marginBottom: "20px",
                }}
              >
                {loginError}
              </div>
            )}
            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "15px" }}>
                <label
                  htmlFor="rollNumber"
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#555",
                    marginBottom: "6px",
                  }}
                >
                  Roll Number
                </label>
                <input
                  type="text"
                  id="rollNumber"
                  value={user.rollNumber}
                  onChange={(e) =>
                    setUser({ ...user, rollNumber: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>
              <div style={{ marginBottom: "15px" }}>
                <label
                  htmlFor="name"
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "bold",
                    color: "#555",
                    marginBottom: "6px",
                  }}
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={user.name}
                  onChange={(e) => setUser({ ...user, name: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "1px solid #ddd",
                    fontSize: "14px",
                  }}
                  required
                />
              </div>
              <button
                type="submit"
                style={{
                  backgroundColor: "#4CAF50",
                  color: "#fff",
                  padding: "12px 18px",
                  borderRadius: "8px",
                  width: "100%",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Login"}
              </button>
            </form>
          </div>
        ) : (
          <div>
            {isLoading ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "200px",
                }}
              >
                <div
                  style={{
                    border: "5px solid #f3f3f3",
                    borderTop: "5px solid #3498db",
                    borderRadius: "50%",
                    width: "50px",
                    height: "50px",
                    animation: "spin 1s linear infinite",
                  }}
                />
              </div>
            ) : formData ? (
              <div>
                <h2
                  style={{
                    fontSize: "24px",
                    fontWeight: "bold",
                    textAlign: "center",
                    marginBottom: "10px",
                  }}
                >
                  {formData.formTitle}
                </h2>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <div>Form ID: {formData.formId}</div>
                  <div>Version: {formData.version}</div>
                </div>
                {/* Progress indicator */}
                <div style={{ marginBottom: "20px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "5px",
                    }}
                  ></div>
                  <div
                    style={{
                      height: "10px",
                      backgroundColor: "#e0e0e0",
                      borderRadius: "5px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        backgroundColor: "#007bff",
                        borderRadius: "5px",
                        width: `${
                          ((currentSection + 1) / formData.sections.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: "20px" }}>
                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "bold",
                        marginBottom: "10px",
                      }}
                    >
                      {formData.sections[currentSection].title}
                    </h3>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#777",
                        marginBottom: "20px",
                      }}
                    >
                      {formData.sections[currentSection].description}
                    </p>
                    {formData.sections[currentSection].fields.map((field) => (
                      <div key={field.fieldId} style={{ marginBottom: "20px" }}>
                        <label
                          htmlFor={field.fieldId}
                          style={{
                            display: "block",
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: "#555",
                            marginBottom: "8px",
                          }}
                        >
                          {field.label}
                        </label>
                        {renderField(field)}
                        {errors[field.fieldId] && (
                          <div
                            style={{
                              color: "#e74c3c",
                              fontSize: "12px",
                              marginTop: "6px",
                            }}
                          >
                            {errors[field.fieldId]}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <button
                      type="button"
                      onClick={handlePrev}
                      style={{
                        backgroundColor: "#ccc",
                        color: "#fff",
                        padding: "10px 15px",
                        borderRadius: "5px",
                        width: "48%",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={handleNext}
                      style={{
                        backgroundColor: "#007bff",
                        color: "#fff",
                        padding: "10px 15px",
                        borderRadius: "5px",
                        width: "48%",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {currentSection === formData.sections.length - 1
                        ? "Submit"
                        : "Next"}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div
                style={{ textAlign: "center", fontSize: "18px", color: "#888" }}
              >
                No form available for this student.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}