import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Modal,
  Button,
  Form,
  InputGroup,
  Spinner,
  Alert,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import PhoneInput from "react-phone-number-input";

// Add styled components or inline styles here
const phoneInputStyles = `
  .verification-modal .PhoneInput {
    background-color: #f8f9fa;
    border: 1px solid #ced4da;
    border-radius: 4px;
    padding: 6px 12px;
    transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
    width: 100%;
  }

  .verification-modal .PhoneInput:focus-within {
    border-color: #80bdff;
    outline: 0;
    box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.25);
  }

  .verification-modal .PhoneInputCountry {
    margin-right: 10px;
  }

  .verification-modal .PhoneInputCountryIcon {
    width: 20px;
    height: 20px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  }

  .verification-modal .PhoneInputCountrySelect {
    background: none;
    border: none;
    color: #495057;
    font-size: 14px;
    padding: 0 5px;
  }

  .verification-modal .PhoneInputInput {
    border: none;
    background: none;
    padding: 0;
    font-size: 16px;
    color: #495057;
    width: 100%;
  }

  .verification-modal .PhoneInputInput:focus {
    outline: none;
    box-shadow: none;
  }

  .verification-modal .input-group-text {
    background-color: #e9ecef;
    border: 1px solid #ced4da;
  }

  .verification-modal .form-control:disabled {
    background-color: #e9ecef;
    opacity: 1;
  }
`;

const Verification = ({ show, onHide, onSuccess }) => {
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
    country: "",
  });

  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);

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
  const [loading, setLoading] = useState({
    email: false,
    mobile: false,
    submit: false,
    otp: false,
  });
  const [message, setMessage] = useState(null);
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [mobileResendTimer, setMobileResendTimer] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BACKEND_URL}/auth/get-user`,
          {},
            { headers: { auth_token: localStorage.getItem("auth_token") || null } }
        );

        const iuser = response.data;
        setForm((prev) => ({
          ...prev,
          email: iuser.email,
          emailVerified: iuser.email_verified,
          mobile: iuser.mobile,
          mobileVerified: iuser.mobile_verified,
          profession: iuser.profession,
          addressLine: iuser.address,
          city: iuser.city,
          state: iuser.state,
          postalCode: iuser.postalCode,
          country: iuser.country,
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

  useEffect(() => {
    let timer;
    if (mobileResendTimer > 0) {
      timer = setTimeout(() => setMobileResendTimer(mobileResendTimer - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [mobileResendTimer]);

  const autoHideMessage = () => {
    setTimeout(() => setMessage(null), 3000);
  };

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleEmailVerification = async () => {
    if (form.emailVerified) return;
    setLoading((prev) => ({ ...prev, email: true }));

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/send-verification`,
        { email: form.email, preRegistered: true },
        { headers: { auth_token: localStorage.getItem("auth_token") || null } }
      );
      const successMessages = [
        "Email verified successfully",
        "Email already verified",
      ];
      if (successMessages.includes(response.data.message)) {
        setForm((prev) => ({ ...prev, emailVerified: true }));
      }

      setMessage({
        type: response.data.type || "success",
        text: response.data.message,
      });
      setEmailResendTimer(30);
    } catch (error) {
      setMessage({
        type: "danger",
        text:
          error.response?.data?.errors?.[0]?.msg || "Error sending verification email.",
      });
    } finally {
      setLoading((prev) => ({ ...prev, email: false }));
      autoHideMessage();
    }
  };

  const [mobile_verification_clicked, set_mobile_verification_clicked] =
    useState(false);

  const handleMobileVerification = async () => {
    if (!mobile_verification_clicked) {
      set_mobile_verification_clicked(true);
    }
    setLoading((prev) => ({ ...prev, mobile: true }));
    
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/verify-mobile`,
        { preRegistered: true, mobile: form.mobile },
        { headers: { auth_token: localStorage.getItem("auth_token") } }
      );
      
      if (response.data && response.data.msg) {
        setMessage({ type: "success", text: response.data.msg });
        setShowOtpInput(true); // Show OTP input field
      } else {
        setMessage({
          type: "danger",
          text: "Unexpected response from server.",
        });
      }
      set_mobile_verification_clicked(false);
      setMobileResendTimer(30);
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.error ||
        "Error sending verification SMS.";
      setMessage({ type: "danger", text: errorMessage });
      set_mobile_verification_clicked(false);
    } finally {
      setLoading((prev) => ({ ...prev, mobile: false }));
      autoHideMessage();
      set_mobile_verification_clicked(false);
    }
  };

  const handleOtpVerification = async () => {
    setLoading((prev) => ({ ...prev, otp: true }));

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/verify-mobile-otp`,
        { mobile: form.mobile, OTP: otp },
        { headers: { auth_token: localStorage.getItem("auth_token") } }
      );

      if (response.data && response.data.msg) {
        setMessage({ type: "success", text: response.data.msg });
        setForm((prev) => ({ ...prev, mobileVerified: true }));
        setShowOtpInput(false); // Hide OTP input field after successful verification
      } else {
        setMessage({
          type: "danger",
          text: "Unexpected response from server.",
        });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.errors?.[0]?.msg ||
        error.response?.data?.error ||
        "Error verifying OTP.";
      setMessage({ type: "danger", text: errorMessage });
    } finally {
      setLoading((prev) => ({ ...prev, otp: false }));
      autoHideMessage();
    }
  };

  const handleSubmit = async () => {
    const { profession, addressLine, city, state, postalCode,country } = form;

    if (!profession || !addressLine || !city || !state || !postalCode || !country) {
      setMessage({ type: "warning", text: "Please fill out all fields." });
      autoHideMessage();
      return;
    }
    setLoading((prev) => ({ ...prev, submit: true }));

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/auth/meta-user`,
        { profession, addressLine, city, state, postalCode, country },
        { headers: { auth_token: localStorage.getItem("auth_token") || null } }
      );

      setMessage({
        type: response.data.type || "success",
        text: response.data.msg,
      });
      onHide();
      onSuccess();
    } catch (error) {
      let respError = error.response?.data?.errors?.[0]?.msg;
      if(!respError){
        respError = error.response?.data?.error || "Error submitting details.";
      }
      setMessage({
        type: "danger",
        text: respError,
      });
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
          <div style={{ flex: 1 }}>
            <PhoneInput
              placeholder="Enter phone number"
              value={form.mobile}
              onChange={(e) => handleChange("mobile", e)}
              disabled={form.mobileVerified}
              international
              defaultCountry="IN"
              className="w-100"
            />
          </div>
          {form.mobileVerified && (
            <InputGroup.Text>
              <FontAwesomeIcon icon={faCheckCircle} className="text-success" />
            </InputGroup.Text>
          )}
        </InputGroup>
        {!form.mobileVerified && (
          <div className="d-flex flex-column gap-2 mt-2">
            <Button
              onClick={handleMobileVerification}
              disabled={loading.mobile || mobileResendTimer > 0}
            >
              {loading.mobile? (
                <Spinner animation="border" size="sm" />
              ) : mobileResendTimer > 0 ? (
              <div>
                <Spinner animation="border" size="sm" />
                Resend OTP in {mobileResendTimer}s
              </div>
              ) : (
                "Verify Mobile"
              )}
            </Button>

            {showOtpInput && (
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <Button onClick={handleOtpVerification} disabled={loading.otp}>
                  {loading.otp ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Submit OTP"
                  )}
                </Button>
              </InputGroup>
            )}
          </div>
        )}
      </Form.Group>
    </>
  );

  const renderStep2 = () => (
    <>
      {/* Form for Step 2 */}
      <Form.Group className="mb-3">
        <Form.Label>Profession</Form.Label>
        <Form.Control
          type="text"
          value={form.profession}
          onChange={(e) => handleChange("profession", e.target.value)}
          placeholder="Enter your profession"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Address Line</Form.Label>
        <Form.Control
          type="text"
          value={form.addressLine}
          onChange={(e) => handleChange("addressLine", e.target.value)}
          placeholder="Enter your address"
        />
      </Form.Group>


      <Form.Group className="mb-3">
        <Form.Label>State</Form.Label>
        <Form.Control
          type="text"
          value={form.state}
          onChange={(e) => handleChange("state", e.target.value)}
          placeholder="Enter your state"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>City</Form.Label>
        <Form.Control
          type="text"
          value={form.city}
          onChange={(e) => handleChange("city", e.target.value)}
          placeholder="Enter your city"
        />
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label>Postal Code</Form.Label>
        <Form.Control
          type="text"
          value={form.postalCode}
          onChange={(e) => handleChange("postalCode", e.target.value)}
          placeholder="Enter your postal code"
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Country</Form.Label>
        <Form.Control
          type="text"
          value={form.country}
          onChange={(e) => handleChange("country", e.target.value)}
          placeholder="Enter your country"
        />
      </Form.Group>
    </>
  );

  return (
    <>
      <style>{phoneInputStyles}</style>
      <Modal
        show={show}
        onHide={onHide}
        centered
        className="verification-modal"
      >
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
            <Button
              variant="secondary"
              onClick={() => setStep(step - 1)}
              disabled={loading.submit}
            >
              Previous
            </Button>
          )}
          {step < 2 && (
            <Button
              variant="primary"
              onClick={() => setStep(step + 1)}
              disabled={loading.submit}
            >
              Next
            </Button>
          )}
          {step === 2 && (
            <Button
              variant="success"
              onClick={handleSubmit}
              disabled={loading.submit}
            >
              {loading.submit ? (
                <Spinner animation="border" size="sm" />
              ) : (
                "Submit"
              )}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Verification;
