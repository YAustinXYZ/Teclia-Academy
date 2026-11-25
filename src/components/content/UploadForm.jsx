import { useState } from 'react';
import api from '../../services/api.js';
import { useContent } from '../../context/ContentContext.jsx';
import { contentPlanOptions } from '../../utils/plans.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { UIIcon } from '../common/Icons.jsx';

export const UploadForm = () => {
  const { t } = usePreferences();
  const plans = contentPlanOptions(t);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('video');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [planTier, setPlanTier] = useState('free');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState(0);

  const { addContent } = useContent();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!title || (!url && !file)) {
      setError('Título y URL o un archivo son requeridos');
      return;
    }

    if (description.trim().length < 10) {
      setError('La descripción debe tener al menos 10 caracteres');
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const form = new FormData();
      form.append('title', title);
      form.append('description', description);
      form.append('type', type);
      if (url) form.append('url', url);
      if (file) form.append('file', file);
      form.append('plan_tier', planTier);
      form.append('is_free', planTier === 'free' ? '1' : '0');

      const res = await api.post('/content/upload', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (evt) => {
          if (evt.total) {
            setProgress(Math.round((evt.loaded / evt.total) * 100));
          }
        },
      });

      addContent(res.data.content);
      setSuccess(true);
      setTitle('');
      setDescription('');
      setUrl('');
      setType('video');
      setFile(null);
      setPlanTier('free');
      setProgress(0);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error uploading content');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="upload-form">
      <h2>Añadir contenido</h2>
      <p className="hint">Sube tu lección y elige para qué plan estará disponible.</p>

      {error && <div key={error} className="error-message animate-shake">{error}</div>}
      {success && <div className="success-message">Contenido agregado correctamente.</div>}

      <div className="form-group">
        <label htmlFor="title">Título</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ej: Lección 1 - Acordes Mayores"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">Descripción</label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el contenido (mínimo 10 caracteres)..."
          rows={3}
          minLength={10}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="type">Tipo de Contenido</label>
          <select id="type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="video">Video</option>
            <option value="article">Artículo</option>
            <option value="quiz">Quiz</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="planTier">Plan requerido</label>
          <select id="planTier" value={planTier} onChange={(e) => setPlanTier(e.target.value)}>
            {plans.map((plan) => (
              <option key={plan.value} value={plan.value}>
                {plan.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="url">URL del Contenido (opcional si subes un archivo)</label>
        <input
          id="url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/contenido"
        />
      </div>

      <div className="form-group">
        <label>Archivo (video/pdf/audio/imagen)</label>
        <label
          className={`dropzone ${dragging ? 'drag' : ''}`}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <span className="dropzone-icon" aria-hidden="true"><UIIcon name="upload" size={26} /></span>
          <span className="dropzone-title">Arrastra un archivo aquí</span>
          <span className="dropzone-hint">o haz clic para seleccionar</span>
          {file && <span className="dropzone-file"><UIIcon name="paperclip" size={14} /> {file.name}</span>}
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0] || null)}
            accept="video/*,application/pdf,audio/*,image/*"
          />
        </label>
      </div>

      {loading && progress > 0 && (
        <div className="upload-progress" aria-label={`Subiendo ${progress}%`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      )}

      <button type="submit" disabled={loading} className="button button-primary button-block">
        {loading ? (
          <span className="btn-loading"><span className="spinner" /> {progress > 0 ? `Subiendo ${progress}%` : 'Subiendo…'}</span>
        ) : 'Añadir contenido'}
      </button>
    </form>
  );
};
