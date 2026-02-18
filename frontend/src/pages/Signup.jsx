import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

function Signup() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    participantType: 'non-iiit',
    collegeName: '',
    contactNumber: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      toast.error('Please fill all required fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    // IIIT email validation on frontend side
    if (form.participantType === 'iiit') {
      const domain = form.email.split('@')[1];
      const validDomains = ['iiit.ac.in', 'students.iiit.ac.in', 'research.iiit.ac.in'];
      if (!validDomains.includes(domain)) {
        toast.error('IIIT participants must use an IIIT email');
        return;
      }
    }

    setSubmitting(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        participantType: form.participantType,
        collegeName: form.collegeName,
        contactNumber: form.contactNumber
      });
      toast.success('Account created!');
      navigate('/onboarding');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="card w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">First Name *</label>
              <input type="text" name="firstName" className="input-field" value={form.firstName} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Last Name *</label>
              <input type="text" name="lastName" className="input-field" value={form.lastName} onChange={handleChange} />
            </div>
          </div>

          <div>
            <label className="label">Participant Type *</label>
            <select name="participantType" className="input-field" value={form.participantType} onChange={handleChange}>
              <option value="non-iiit">Non-IIIT Participant</option>
              <option value="iiit">IIIT Student</option>
            </select>
          </div>

          <div>
            <label className="label">Email *</label>
            <input type="email" name="email" className="input-field" value={form.email} onChange={handleChange}
              placeholder={form.participantType === 'iiit' ? 'yourname@students.iiit.ac.in' : 'your@email.com'} />
          </div>

          <div>
            <label className="label">College / Organization</label>
            <input type="text" name="collegeName" className="input-field" value={form.collegeName} onChange={handleChange} />
          </div>

          <div>
            <label className="label">Contact Number</label>
            <input type="text" name="contactNumber" className="input-field" value={form.contactNumber} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Password *</label>
              <input type="password" name="password" className="input-field" value={form.password} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Confirm Password *</label>
              <input type="password" name="confirmPassword" className="input-field" value={form.confirmPassword} onChange={handleChange} />
            </div>
          </div>

          <button type="submit" disabled={submitting} className="btn-primary w-full">
            {submitting ? 'Creating...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
