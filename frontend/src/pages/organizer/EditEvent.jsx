import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';

function EditEvent() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);

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

  const [customFields, setCustomFields] = useState([]);
  const [merchItems, setMerchItems] = useState([]);

  useEffect(() => {
    loadEvent();
  }, [id]);

  const loadEvent = async () => {
    try {
      const res = await api.get('/organizers/events/' + id);
      const eventData = res.data.event;
      
      setEvent(eventData);
      setForm({
        name: eventData.name,
        description: eventData.description,
        eventType: eventData.eventType,
        eligibility: eventData.eligibility,
        registrationDeadline: eventData.registrationDeadline ? 
          new Date(eventData.registrationDeadline).toISOString().slice(0, 16) : '',
        startDate: eventData.startDate ? 
          new Date(eventData.startDate).toISOString().slice(0, 16) : '',
        endDate: eventData.endDate ? 
          new Date(eventData.endDate).toISOString().slice(0, 16) : '',
        registrationLimit: eventData.registrationLimit,
        registrationFee: eventData.registrationFee,
        tags: eventData.tags || ''
      });

      if (eventData.eventType === 'normal') {
        setCustomFields(eventData.customFormFields || []);
      } else {
        setMerchItems(eventData.merchandiseVariants || []);
      }
    } catch (err) {
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Form Builder functions
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

  // Merchandise functions
  const addMerchItem = () => {
    setMerchItems([...merchItems, {
      size: '',
      color: '',
      stockQuantity: 0,
      purchaseLimit: 1
    }]);
  };

  const updateMerchItem = (index, key, value) => {
    const updated = [...merchItems];
    updated[index][key] = value;
    setMerchItems(updated);
  };

  const removeMerchItem = (index) => {
    setMerchItems(merchItems.filter((_, i) => i !== index));
  };

  const getEditableFields = () => {
    if (!event) return {};
    
    switch (event.status) {
      case 'draft':
        // All fields editable
        return {
          all: true
        };
      case 'published':
        // Limited fields editable
        return {
          description: true,
          registrationDeadline: true,
          registrationLimit: true,
          status: true
        };
      case 'ongoing':
      case 'completed':
        // Only status editable
        return {
          status: true
        };
      default:
        return {};
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const editableFields = getEditableFields();
      let updateData = {};

      if (editableFields.all) {
        // Draft: save all fields
        updateData = {
          ...form,
          customFormFields: form.eventType === 'normal' ? customFields : [],
          merchandiseVariants: form.eventType === 'merchandise' ? merchItems : []
        };
      } else {
        // Published/ongoing: save only allowed fields
        Object.keys(editableFields).forEach(field => {
          if (field !== 'all' && form[field] !== undefined) {
            updateData[field] = form[field];
          }
        });
      }

      await api.put('/organizers/events/' + id, updateData);
      toast.success('Event updated successfully');
      navigate('/organizer/events/' + id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading event...</div>;
  if (!event) return <div className="text-center py-10 text-red-500">Event not found</div>;

  const editableFields = getEditableFields();
  const isDraft = event.status === 'draft';
  const isPublished = event.status === 'published';
  const isOngoing = event.status === 'ongoing' || event.status === 'completed';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Edit Event</h1>
        <div className="flex items-center gap-2 mt-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            event.status === 'draft' ? 'bg-gray-100 text-gray-700' :
            event.status === 'published' ? 'bg-green-100 text-green-700' :
            event.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
            'bg-purple-100 text-purple-700'
          }`}>
            {event.status}
          </span>
          {!isDraft && (
            <span className="text-sm text-gray-500">
              {isPublished ? 'Limited editing allowed' : 'Only status changes allowed'}
            </span>
          )}
        </div>
      </div>

      <div className="card">
        {/* Step 1: Basic Information */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Basic Information</h2>
          
          {editableFields.all || editableFields.name ? (
            <div>
              <label className="label">Event Name</label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="input-field"
                disabled={!editableFields.all && !editableFields.name}
              />
            </div>
          ) : (
            <div>
              <label className="label">Event Name</label>
              <div className="input-field bg-gray-50">{form.name}</div>
            </div>
          )}

          {editableFields.all || editableFields.description ? (
            <div>
              <label className="label">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="input-field"
                disabled={!editableFields.all && !editableFields.description}
              />
            </div>
          ) : (
            <div>
              <label className="label">Description</label>
              <div className="input-field bg-gray-50 min-h-[100px]">{form.description}</div>
            </div>
          )}

          {editableFields.all && (
            <>
              <div>
                <label className="label">Event Type</label>
                <select name="eventType" value={form.eventType} onChange={handleChange} className="input-field">
                  <option value="normal">Normal Event</option>
                  <option value="merchandise">Merchandise Event</option>
                </select>
              </div>

              <div>
                <label className="label">Eligibility</label>
                <select name="eligibility" value={form.eligibility} onChange={handleChange} className="input-field">
                  <option value="all">All</option>
                  <option value="iiit">IIIT Only</option>
                  <option value="external">External Only</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    value={form.startDate}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">End Date & Time</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    value={form.endDate}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Registration Limit</label>
                  <input
                    type="number"
                    name="registrationLimit"
                    value={form.registrationLimit}
                    onChange={handleChange}
                    min="0"
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="label">Registration Fee (₹)</label>
                  <input
                    type="number"
                    name="registrationFee"
                    value={form.registrationFee}
                    onChange={handleChange}
                    min="0"
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="label">Registration Deadline</label>
                <input
                  type="datetime-local"
                  name="registrationDeadline"
                  value={form.registrationDeadline}
                  onChange={handleChange}
                  className="input-field"
                />
              </div>

              <div>
                <label className="label">Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={form.tags}
                  onChange={handleChange}
                  placeholder="workshop, technical, fun"
                  className="input-field"
                />
              </div>
            </>
          )}

          {/* Status Change (always allowed) */}
          <div>
            <label className="label">Event Status</label>
            <select name="status" value={event.status} onChange={(e) => setEvent({...event, status: e.target.value})} className="input-field">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          {/* Custom Form Fields (only for drafts) */}
          {editableFields.all && form.eventType === 'normal' && (
            <div>
              <h3 className="text-md font-semibold mb-3">Custom Registration Fields</h3>
              {customFields.length === 0 ? (
                <p className="text-gray-500 text-sm mb-3">No custom fields added</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {customFields.map((field, index) => (
                    <div key={index} className="border rounded p-3 bg-gray-50">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Field Label"
                          value={field.label}
                          onChange={(e) => updateFormField(index, 'label', e.target.value)}
                          className="input-field text-sm"
                        />
                        <select
                          value={field.fieldType}
                          onChange={(e) => updateFormField(index, 'fieldType', e.target.value)}
                          className="input-field text-sm"
                        >
                          <option value="text">Text</option>
                          <option value="dropdown">Dropdown</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="file">File Upload</option>
                        </select>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) => updateFormField(index, 'required', e.target.checked)}
                            className="mr-1"
                          />
                          Required
                        </label>
                        <button
                          onClick={() => removeFormField(index)}
                          className="text-red-500 text-sm hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={addFormField} className="btn-secondary">
                + Add Custom Field
              </button>
            </div>
          )}

          {/* Merchandise Variants (only for drafts) */}
          {editableFields.all && form.eventType === 'merchandise' && (
            <div>
              <h3 className="text-md font-semibold mb-3">Merchandise Variants</h3>
              {merchItems.length === 0 ? (
                <p className="text-gray-500 text-sm mb-3">No variants added</p>
              ) : (
                <div className="space-y-2 mb-3">
                  {merchItems.map((item, index) => (
                    <div key={index} className="border rounded p-3 bg-gray-50">
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          placeholder="Size"
                          value={item.size}
                          onChange={(e) => updateMerchItem(index, 'size', e.target.value)}
                          className="input-field text-sm"
                        />
                        <input
                          type="text"
                          placeholder="Color"
                          value={item.color}
                          onChange={(e) => updateMerchItem(index, 'color', e.target.value)}
                          className="input-field text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="number"
                          placeholder="Stock Quantity"
                          value={item.stockQuantity}
                          onChange={(e) => updateMerchItem(index, 'stockQuantity', parseInt(e.target.value))}
                          className="input-field text-sm"
                          min="0"
                        />
                        <input
                          type="number"
                          placeholder="Purchase Limit"
                          value={item.purchaseLimit}
                          onChange={(e) => updateMerchItem(index, 'purchaseLimit', parseInt(e.target.value))}
                          className="input-field text-sm"
                          min="1"
                        />
                      </div>
                      <button
                        onClick={() => removeMerchItem(index)}
                        className="text-red-500 text-sm hover:underline"
                      >
                        Remove Variant
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button type="button" onClick={addMerchItem} className="btn-secondary">
                + Add Variant
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => navigate('/organizer/events/' + id)}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditEvent;
