import { useEffect, useState } from "react";
import { ErrorMessage, Field, FieldArray, Form, Formik } from "formik";
import * as Yup from "yup";
import "../App.css";

const STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","DC","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM",
  "NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA",
  "WV","WI","WY"
];

const SKILLS = [
  "Communication",
  "Teamwork",
  "Organized",
  "Adaptability",
  "Driving",
  "English",
  "Spanish",
];

const DEFAULT_FORM = {
  fullName: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  zip: "",
  skills: [],
  preferences: "",
  availability: ["", "", ""],
};

const profileSchema = Yup.object({
  fullName: Yup.string().max(50).required("Full name is required"),
  address1: Yup.string().max(100).required("Address 1 is required"),
  address2: Yup.string().max(100),
  city: Yup.string().max(100).required("City is required"),
  state: Yup.string()
    .oneOf(STATES, "Select a valid US state")
    .required("State is required"),
  zip: Yup.string()
    .matches(/^\d{5}(\d{4})?$/, "Zip must be 5 or 9 digits")
    .required("Zip code is required"),
  skills: Yup.array()
    .of(Yup.string().oneOf(SKILLS))
    .min(1, "Pick at least one skill"),
  preferences: Yup.string().max(1000),
  availability: Yup.array()
    .of(
      Yup.string()
        .required("Date is required")
        .test("is-date", "Use a valid date", (value) => {
          if (!value) return false;
          return !Number.isNaN(new Date(value).getTime());
        })
    )
    .min(1, "Provide at least one availability date"),
});

const API_BASE = "http://localhost:3001";

const ProfileForm = () => {
  const [initialValues, setInitialValues] = useState(DEFAULT_FORM);
  const [userId, setUserId] = useState("1");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: "", errors: [] });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;
      setLoading(true);
      setStatus({ message: "", errors: [] });
      try {
        const response = await fetch(`${API_BASE}/profile`, {
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
        });
        const result = await response.json();
        if (response.ok && result) {
          setInitialValues({
            fullName: result.fullName || "",
            address1: result.address1 || "",
            address2: result.address2 || "",
            city: result.city || "",
            state: result.state || "",
            zip: result.zip || "",
            skills: result.skills?.length ? result.skills : [],
            preferences: result.preferences || "",
            availability:
              result.availability?.length > 0 ? result.availability : [""],
          });
        } else {
          setInitialValues(DEFAULT_FORM);
        }
      } catch (error) {
        setStatus({ message: "", errors: ["Failed to load profile"] });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleSubmit = async (values, { setSubmitting }) => {
    setStatus({ message: "", errors: [] });
    try {
      const response = await fetch(`${API_BASE}/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify({
          ...values,
          address2: values.address2 || null,
          preferences: values.preferences || null,
          availability: values.availability.filter(Boolean),
        }),
      });
      const result = await response.json();
      if (response.ok) {
        setStatus({ message: "Profile saved!", errors: [] });
      } else if (result?.errors?.length) {
        setStatus({ message: "", errors: result.errors });
      } else {
        setStatus({
          message: "",
          errors: [result?.error || "Failed to save profile"],
        });
      }
    } catch (error) {
      setStatus({
        message: "",
        errors: ["Something went wrong, please try again"],
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="container">
        <Formik
          enableReinitialize
          initialValues={initialValues}
          validationSchema={profileSchema}
          onSubmit={handleSubmit}
        >
          {({ values, isSubmitting, setFieldValue }) => (
            <Form>
              <h1>Volunteer Profile Form</h1>

              <div className="field">
                <label htmlFor="userId">User ID header (mock auth)</label>
                <input
                  id="userId"
                  type="number"
                  min="1"
                  value={userId}
                  onChange={(event) => setUserId(event.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="fullName">
                  Full Name <span className="required">*</span>
                </label>
                <Field id="fullName" name="fullName" type="text" maxLength="50" />
                <ErrorMessage name="fullName" component="span" className="error" />
              </div>

              <div className="field">
                <label htmlFor="address1">
                  Address 1 <span className="required">*</span>
                </label>
                <Field id="address1" name="address1" type="text" maxLength="100" />
                <ErrorMessage name="address1" component="span" className="error" />
              </div>

              <div className="field">
                <label htmlFor="address2">Address 2</label>
                <Field id="address2" name="address2" type="text" maxLength="100" />
                <ErrorMessage name="address2" component="span" className="error" />
              </div>

              <div className="row">
                <div className="field">
                  <label htmlFor="city">
                    City <span className="required">*</span>
                  </label>
                  <Field id="city" name="city" type="text" maxLength="100" />
                  <ErrorMessage name="city" component="span" className="error" />
                </div>
                <div className="field">
                  <label htmlFor="state">
                    State <span className="required">*</span>
                  </label>
                  <Field id="state" name="state" as="select">
                    <option value="">Select state</option>
                    {STATES.map((code) => (
                      <option key={code} value={code}>
                        {code}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage name="state" component="span" className="error" />
                </div>
              </div>

              <div className="field">
                <label htmlFor="zip">
                  Zip code <span className="required">*</span>
                </label>
                <Field id="zip" name="zip" type="text" maxLength="9" />
                <ErrorMessage name="zip" component="span" className="error" />
              </div>

              <div className="field">
                <label htmlFor="skills">
                  Skills <span className="required">*</span>
                </label>
                <select
                  id="skills"
                  multiple
                  value={values.skills}
                  onChange={(event) => {
                    const selected = Array.from(event.target.selectedOptions).map(
                      (option) => option.value
                    );
                    setFieldValue("skills", selected);
                  }}
                >
                  {SKILLS.map((skill) => (
                    <option key={skill} value={skill}>
                      {skill}
                    </option>
                  ))}
                </select>
                <ErrorMessage name="skills" component="span" className="error" />
              </div>

              <div className="field">
                <label htmlFor="preferences">Preferences</label>
                <Field
                  id="preferences"
                  name="preferences"
                  as="textarea"
                  maxLength="1000"
                  placeholder="Anything we should know? (optional)"
                />
                <ErrorMessage
                  name="preferences"
                  component="span"
                  className="error"
                />
              </div>

              <div className="field">
                <label>
                  Availability (pick one or more dates)
                  <span className="required"> *</span>
                </label>
                <FieldArray name="availability">
                  {() => (
                    <>
                      {values.availability.map((_, index) => (
                        <Field
                          key={`availability-${index}`}
                          type="date"
                          name={`availability.${index}`}
                          required={index === 0}
                        />
                      ))}
                      <ErrorMessage
                        name="availability"
                        component="span"
                        className="error"
                      />
                    </>
                  )}
                </FieldArray>
              </div>

              {status.errors.length > 0 && (
                <div className="notice error">
                  {status.errors.map((err) => (
                    <p key={err}>{err}</p>
                  ))}
                </div>
              )}
              {status.message && (
                <div className="notice success">{status.message}</div>
              )}

              <button type="submit" disabled={isSubmitting || loading}>
                {isSubmitting ? "Saving..." : "Save Profile"}
              </button>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default ProfileForm;

