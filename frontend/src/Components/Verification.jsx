import React, { useState, useEffect } from "react";
import axios from "axios";
import { Modal, Button, Form, InputGroup, Spinner, Alert } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";

const Verification = ({ show, onHide }) => {
  const [form, setForm] = useState({
    email: "",
    mobile: "",
    emailVerified: false,
    mobileVerified: false,
    profession: "",
    addressLine: "",
    city: "",
    state: "",
    postalCode: "",
  });
  useEffect(() => {
    let interval;
    if (!form.emailVerified) {
      interval = setInterval(async () => {
        try {
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/auth/email-verify-status`,
            { email: form.email }
          );
          if (response.data.status) {
            setForm((prev) => ({ ...prev, emailVerified: true }));
            clearInterval(interval);
          }
        } catch (error) {
          console.error("Error checking email verification status:", error);
        }
      }, 5000); // Check every 5 seconds
    }
    return () => clearInterval(interval);
  }, [form.email]);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState({ email: false, mobile: false, submit: false });
  const [message, setMessage] = useState(null);
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/auth/get-user`,
          {},
          { headers: { auth_token: `${localStorage.getItem("auth_token")}` } }
        );

        const iuser = response.data;
        setForm((prev) => ({
          ...prev,
          email: iuser.email,
          emailVerified: iuser.email_verified,
          mobile: iuser.mobile,
          mobileVerified: iuser.mobile_verified,
        }));
      } catch (error) {
        setMessage({ type: "danger", text: "Error fetching user details." });
        autoHideMessage();
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    let timer;
    if (emailResendTimer > 0) {
      timer = setTimeout(() => setEmailResendTimer(emailResendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [emailResendTimer]);

  const autoHideMessage = () => {
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isValidEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const isValidMobile = (mobile) => /^[0-9]{10}$/.test(mobile);

  const handleEmailVerification = async () => {
    if (form.emailVerified) return;
    if (!isValidEmail(form.email)) {
      setMessage({ type: "warning", text: "Invalid email address." });
      autoHideMessage();
      return;
    }
    setLoading((prev) => ({ ...prev, email: true }));
  
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/send-verification`,
        { email: form.email, preRegistered: true },
        { headers: { auth_token: localStorage.getItem("auth_token") } }
      );
  
      const successMessages = ["Email verified successfully", "Email already verified"];
      if (successMessages.includes(response.data.message)) {
        setForm((prev) => ({ ...prev, emailVerified: true }));
      }
  
      setMessage({ type: response.data.type || "success", text: response.data.message });
      setEmailResendTimer(30);
    } catch (error) {
      setMessage({ type: "danger", text: error.response?.data?.message || "Error sending verification email." });
    } finally {
      setLoading((prev) => ({ ...prev, email: false }));
      autoHideMessage();
    }
  };
  
  const handleMobileVerification = async () => {
    if (!isValidMobile(form.mobile)) {
      setMessage({ type: "warning", text: "Invalid mobile number." });
      autoHideMessage();
      return;
    }
    setLoading((prev) => ({ ...prev, mobile: true }));

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/send-mobile-verification`,
        { mobile: form.mobile }
      );
      setMessage({ type: response.data.type || "success", text: response.data.message });
    } catch (error) {
      setMessage({ type: "danger", text: error.response?.data?.message || "Error sending verification SMS." });
    } finally {
      setLoading((prev) => ({ ...prev, mobile: false }));
      autoHideMessage();
    }
  };

  const handleSubmit = async () => {
    const { profession, addressLine, city, state, postalCode } = form;

    if (!profession || !addressLine || !city || !state || !postalCode) {
      setMessage({ type: "warning", text: "Please fill out all fields." });
      autoHideMessage();
      return;
    }
    setLoading((prev) => ({ ...prev, submit: true }));

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/submit-details`,
        { profession, addressLine, city, state, postalCode },
        { headers: { auth_token: `${localStorage.getItem("auth_token")}` } }
      );

      setMessage({ type: response.data.type || "success", text: response.data.message });
      onHide();
      navigate("/next-page");
    } catch (error) {
      setMessage({ type: "danger", text: error.response?.data?.message || "Error submitting details." });
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
      autoHideMessage();
    }
  };

  const renderStep1 = () => (
    <>
      <Form.Group className="mb-3">
        <Form.Label>Email</Form.Label>
        <InputGroup>
          <Form.Control
            type="email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            disabled={form.emailVerified}
            placeholder="Enter email"
          />
          {form.emailVerified && (
            <InputGroup.Text>
              <FontAwesomeIcon icon={faCheckCircle} className="text-success" />
            </InputGroup.Text>
          )}
        </InputGroup>
        {!form.emailVerified && (
          <Button
            onClick={handleEmailVerification}
            className="mt-2"
            disabled={loading.email || emailResendTimer > 0}
          >
            {loading.email ? (
              <Spinner animation="border" size="sm" />
            ) : emailResendTimer > 0 ? (
              `Resend Email (${emailResendTimer}s)`
            ) : (
              "Verify Email"
            )}
          </Button>
        )}
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Mobile</Form.Label>
        <InputGroup>
          <Form.Control
            type="text"
            value={form.mobile}
            onChange={(e) => handleChange("mobile", e.target.value)}
            disabled={form.mobileVerified}
            placeholder="Enter mobile number"
          />
          {form.mobileVerified && (
            <InputGroup.Text>
              <FontAwesomeIcon icon={faCheckCircle} className="text-success" />
            </InputGroup.Text>
          )}
        </InputGroup>
        {!form.mobileVerified && (
          <Button onClick={handleMobileVerification} className="mt-2" disabled={loading.mobile}>
            {loading.mobile ? <Spinner animation="border" size="sm" /> : "Verify Mobile"}
          </Button>
        )}
      </Form.Group>
    </>
  );

  const renderStep2 = () => (
    <>
      {/* Form for Step 2 */}
    </>
  );

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Course Purchase</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {message && <Alert variant={message.type}>{message.text}</Alert>}
      </Modal.Body>
      <Modal.Footer>
        {step > 1 && (
          <Button variant="secondary" onClick={() => setStep(step - 1)} disabled={loading.submit}>
            Previous
          </Button>
        )}
        {step < 2 && (
          <Button variant="primary" onClick={() => setStep(step + 1)} disabled={loading.submit}>
            Next
          </Button>
        )}
        {step === 2 && (
          <Button variant="success" onClick={handleSubmit} disabled={loading.submit}>
            {loading.submit ? <Spinner animation="border" size="sm" /> : "Submit"}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default Verification;
