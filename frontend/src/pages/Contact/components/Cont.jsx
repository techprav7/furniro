import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import api from "../../../utils/api";
import vectorImg from "../../../assets/Vector.png";
import phoneImg from "../../../assets/bxs_phone.png";
import clockImg from "../../../assets/bi_clock-fill.png";

const Cont = () => {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: prev.name || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        email: prev.email || user.primaryEmailAddress?.emailAddress || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const data = await api("/api/contact", {
        method: "POST",
        body: formData,
      });
      setSuccessMsg(data.message);
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (error) {
      setErrorMsg(error.message);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-4 gap-2 mb-5">
      <h3>Get in Touch with Us</h3>
      <div className="para">
        <p className="text-center text-gray-500 mb-0">
          For More Information About Our Product & Services.
        </p>
        <p className="text-center text-gray-500">
          Please Feel Free To Drop Us An Email. Our Staff Always Be There To Help You Out. Do Not Hesitate!
        </p>
      </div>

      {/* Messages */}
      {successMsg && (
        <div className="w-full max-w-2xl p-3 bg-green-100 border border-green-300 text-green-700 rounded-lg text-sm text-center">
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="w-full max-w-2xl p-3 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm text-center">
          {errorMsg}
        </div>
      )}

      <div className="form-wrapper flex flex-col md:flex-row gap-5 mb-7">
        <div className="left-panel flex flex-col bg-[#faf3ea] rounded p-3">
          <div className="flex flex-col">
            <div className="flex gap-2">
              <img src={vectorImg} alt="Address" />
              <h5 className="mb-0">Address</h5>
            </div>
            <p>400 University Drive Suite 200 Coral Gables, FL 33134 USA</p>
          </div>
          <div className="flex flex-col">
            <div className="flex gap-2">
              <img src={phoneImg} alt="Phone" />
              <h5 className="mb-0">Phone</h5>
            </div>
            <p>Mobile: +(84) 546-6789<br />Hotline: +(84) 456-6789</p>
          </div>
          <div className="flex flex-col mb-0">
            <div className="flex gap-2">
              <img src={clockImg} alt="Working Time" />
              <h5 className="mb-0">Working Time</h5>
            </div>
            <p className="mb-0">Monday–Friday: 9:00 – 22:00<br />Saturday–Sunday: 9:00 – 21:00</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="right-panel flex flex-col w-full">
          <h6>Your name</h6>
          <input
            type="text"
            name="name"
            placeholder="Your Name"
            value={formData.name}
            onChange={handleChange}
            className="border border-gray-500 p-2 rounded mb-4"
            required
          />

          <h6>Email address</h6>
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            className="border border-gray-500 p-2 rounded mb-4"
            required
          />

          <h6>Subject</h6>
          <input
            type="text"
            name="subject"
            placeholder="Subject (optional)"
            value={formData.subject}
            onChange={handleChange}
            className="border border-gray-500 p-2 rounded mb-4"
          />

          <h6>Message</h6>
          <textarea
            name="message"
            placeholder="Write your message here..."
            value={formData.message}
            onChange={handleChange}
            className="border border-gray-500 p-2 rounded h-[100px] resize-none"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="mt-4 py-2 px-10 border-2 border-[#B88E2F] text-[#B88E2F] font-bold hover:bg-[#B88E2F] hover:text-white transition duration-300 disabled:opacity-50 self-start"
          >
            {loading ? "Sending..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Cont;