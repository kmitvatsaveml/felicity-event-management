import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function CreateEvent() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: basic info, 2: form builder / merch, 3: review
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: '',
    description: '',
    eventType: 'normal',
    eligibility: 'all',
    registrationDeadline: '',
    startDate: '',
    endDate: '',
    registrationLimit: 0,
    registrationFee: 0,
    tags: ''
  });

  // custom form fields for normal events
  const [customFields, setCustomFields] = useState([]);

  // merch items for merchandise events
  const [merchItems, setMerchItems] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // --- Form Builder functions ---
  const addFormField = () => {
    setCustomFields([...customFields, {
      label: '',
      fieldType: 'text',
      options: [],
      required: false,
      order: customFields.length
    }]);
  };

  const updateFormField = (index, key, value) => {
    const updated = [...customFields];
    updated[index][key] = value;
    setCustomFields(updated);
  };

  const removeFormField = (index) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const moveField = (index, direction) => {
    if ((direction === -1 && index === 0) || (direction === 1 && index === customFields.length - 1)) return;
    const updated = [...customFields];
    const swapIdx = index + direction;
    [updated[index], updated[swapIdx]] = [updated[swapIdx], updated[index]];
    updated.forEach((f, i) => f.order = i);
    setCustomFields(updated);
  };

  // --- Merchandise item functions ---
  const addMerchItem = () => {
    setMerchItems([...merchItems, { size: '', color: '', stock: 0, purchaseLimit: 1 }]);
  };

  const updateMerchItem = (index, key, value) => {
    const updated = [...merchItems];
    updated[index][key] = value;
    setMerchItems(updated);
  };

  const removeMerchItem = (index) => {
    setMerchItems(merchItems.filter((_, i) => i !== index));
  };

  const handleSubmit = async (publish) => {
    // basic validation
    if (!form.name || !form.startDate || !form.endDate || !form.registrationDeadline) {
      toast.error('Please fill all required fields');
      return;
    }

    if (new Date(form.startDate) > new Date(form.endDate)) {
      toast.error('End date must be after start date');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        registrationLimit: parseInt(form.registrationLimit) || 0,
        registrationFee: parseFloat(form.registrationFee) || 0,
        customForm: form.eventType === 'normal' ? customFields : [],
        merchItems: form.eventType === 'merchandise' ? merchItems.map(item => ({
          ...item,
          stock: parseInt(item.stock) || 0,
          purchaseLimit: parseInt(item.purchaseLimit) || 1
        })) : []
      };

      const res = await api.post('/organizers/events', payload);

      // if publish is true, update status right away
      if (publish) {
        await api.put('/organizers/events/' + res.data._id, { status: 'published' });
        toast.success('Event created and published!');
      } else {
        toast.success('Event saved as draft');
      }

      navigate('/organizer/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Event</h1>

      {/* Step indicators */}
      <div className="flex gap-4 mb-6">
        {[1, 2, 3].map(s => (
          <button key={s} onClick={() => setStep(s)}
            className={`flex-1 py-2 text-center rounded text-sm font-medium ${
              step === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
            Step {s}: {s === 1 ? 'Basic Info' : s === 2 ? (form.eventType === 'merchandise' ? 'Merchandise' : 'Form Builder') : 'Review'}
          </button>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="card space-y-4">
          <div>
            <label className="label">Event Name *</label>
            <input type="text" name="name" className="input-field" value={form.name} onChange={handleChange} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea name="description" className="input-field" rows={4} value={form.description} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Event Type *</label>
              <select name="eventType" className="input-field" value={form.eventType} onChange={handleChange}>
                <option value="normal">Normal (Individual)</option>
                <option value="merchandise">Merchandise</option>
              </select>
            </div>
            <div>
              <label className="label">Eligibility</label>
              <select name="eligibility" className="input-field" value={form.eligibility} onChange={handleChange}>
                <option value="all">Open to All</option>
                <option value="iiit">IIIT Only</option>
                <option value="non-iiit">Non-IIIT Only</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Start Date *</label>
              <input type="datetime-local" name="startDate" className="input-field" value={form.startDate} onChange={handleChange} />
            </div>
            <div>
              <label className="label">End Date *</label>
              <input type="datetime-local" name="endDate" className="input-field" value={form.endDate} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Registration Deadline *</label>
              <input type="datetime-local" name="registrationDeadline" className="input-field" value={form.registrationDeadline} onChange={handleChange} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Registration Limit (0 = unlimited)</label>
              <input type="number" name="registrationLimit" className="input-field" min={0} value={form.registrationLimit} onChange={handleChange} />
            </div>
            <div>
              <label className="label">Registration Fee (₹)</label>
              <input type="number" name="registrationFee" className="input-field" min={0} step="0.01" value={form.registrationFee} onChange={handleChange} />
            </div>
          </div>
          <div>
            <label className="label">Tags (comma separated)</label>
            <input type="text" name="tags" className="input-field" placeholder="coding, hackathon, web dev" value={form.tags} onChange={handleChange} />
          </div>
          <div className="flex justify-end">
            <button onClick={() => setStep(2)} className="btn-primary">Next &rarr;</button>
          </div>
        </div>
      )}

      {/* Step 2: Form Builder (Normal) or Merchandise Items */}
      {step === 2 && form.eventType === 'normal' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Custom Registration Form</h2>
            <button onClick={addFormField} className="btn-secondary text-sm">+ Add Field</button>
          </div>

          {customFields.length === 0 && (
            <p className="text-gray-400 text-sm mb-4">No custom fields added. The default fields (name, email) are always collected.</p>
          )}

          <div className="space-y-4">
            {customFields.map((field, idx) => (
              <div key={idx} className="border rounded p-3">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-400">Field #{idx + 1}</span>
                  <div className="flex gap-1">
                    <button onClick={() => moveField(idx, -1)} className="text-xs px-2 py-1 bg-gray-100 rounded" title="Move up">↑</button>
                    <button onClick={() => moveField(idx, 1)} className="text-xs px-2 py-1 bg-gray-100 rounded" title="Move down">↓</button>
                    <button onClick={() => removeFormField(idx)} className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">Remove</button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Label</label>
                    <input type="text" className="input-field text-sm" value={field.label}
                      onChange={(e) => updateFormField(idx, 'label', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Field Type</label>
                    <select className="input-field text-sm" value={field.fieldType}
                      onChange={(e) => updateFormField(idx, 'fieldType', e.target.value)}>
                      <option value="text">Text</option>
                      <option value="textarea">Text Area</option>
                      <option value="number">Number</option>
                      <option value="email">Email</option>
                      <option value="dropdown">Dropdown</option>
                      <option value="checkbox">Checkbox</option>
                      <option value="file">File Upload</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={field.required}
                        onChange={(e) => updateFormField(idx, 'required', e.target.checked)} />
                      Required
                    </label>
                  </div>
                </div>
                {field.fieldType === 'dropdown' && (
                  <div className="mt-2">
                    <label className="text-xs text-gray-500">Options (comma separated)</label>
                    <input type="text" className="input-field text-sm" placeholder="Option 1, Option 2, Option 3"
                      value={field.options.join(', ')}
                      onChange={(e) => updateFormField(idx, 'options', e.target.value.split(',').map(o => o.trim()))} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4">
            <button onClick={() => setStep(1)} className="btn-secondary">&larr; Back</button>
            <button onClick={() => setStep(3)} className="btn-primary">Next &rarr;</button>
          </div>
        </div>
      )}

      {step === 2 && form.eventType === 'merchandise' && (
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Merchandise Variants</h2>
            <button onClick={addMerchItem} className="btn-secondary text-sm">+ Add Variant</button>
          </div>

          {merchItems.length === 0 && (
            <p className="text-gray-400 text-sm mb-4">Add at least one variant (size/color combination).</p>
          )}

          <div className="space-y-3">
            {merchItems.map((item, idx) => (
              <div key={idx} className="border rounded p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-gray-400">Variant #{idx + 1}</span>
                  <button onClick={() => removeMerchItem(idx)} className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded">Remove</button>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Size</label>
                    <input type="text" className="input-field text-sm" placeholder="M, L, XL..." value={item.size}
                      onChange={(e) => updateMerchItem(idx, 'size', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Color</label>
                    <input type="text" className="input-field text-sm" placeholder="Black, White..." value={item.color}
                      onChange={(e) => updateMerchItem(idx, 'color', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Stock</label>
                    <input type="number" className="input-field text-sm" min={0} value={item.stock}
                      onChange={(e) => updateMerchItem(idx, 'stock', e.target.value)} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Limit/Person</label>
                    <input type="number" className="input-field text-sm" min={1} value={item.purchaseLimit}
                      onChange={(e) => updateMerchItem(idx, 'purchaseLimit', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-4">
            <button onClick={() => setStep(1)} className="btn-secondary">&larr; Back</button>
            <button onClick={() => setStep(3)} className="btn-primary">Next &rarr;</button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Review & Submit</h2>
          <div className="space-y-2 text-sm mb-6">
            <p><span className="text-gray-500">Name:</span> <strong>{form.name}</strong></p>
            <p><span className="text-gray-500">Type:</span> {form.eventType}</p>
            <p><span className="text-gray-500">Eligibility:</span> {form.eligibility}</p>
            <p><span className="text-gray-500">Start:</span> {form.startDate}</p>
            <p><span className="text-gray-500">End:</span> {form.endDate}</p>
            <p><span className="text-gray-500">Deadline:</span> {form.registrationDeadline}</p>
            <p><span className="text-gray-500">Limit:</span> {form.registrationLimit || 'Unlimited'}</p>
            <p><span className="text-gray-500">Fee:</span> {form.registrationFee > 0 ? '₹' + form.registrationFee : 'Free'}</p>
            <p><span className="text-gray-500">Tags:</span> {form.tags || 'None'}</p>
            {form.eventType === 'normal' && (
              <p><span className="text-gray-500">Custom Fields:</span> {customFields.length} field(s)</p>
            )}
            {form.eventType === 'merchandise' && (
              <p><span className="text-gray-500">Variants:</span> {merchItems.length} variant(s)</p>
            )}
            {form.description && (
              <div>
                <span className="text-gray-500">Description:</span>
                <p className="mt-1 text-gray-700 whitespace-pre-wrap">{form.description}</p>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="btn-secondary">&larr; Back</button>
            <div className="flex gap-2">
              <button onClick={() => handleSubmit(false)} disabled={saving} className="btn-secondary">
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button onClick={() => handleSubmit(true)} disabled={saving} className="btn-primary">
                {saving ? 'Publishing...' : 'Publish Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CreateEvent;
