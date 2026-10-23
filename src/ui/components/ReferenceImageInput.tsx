import { useEffect, useId, useRef, useState } from 'react';
import { Icon } from './Icon';

export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export function validateReferenceImage(file: Pick<File, 'type' | 'size' | 'name'>): string | null {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const typeOk = ACCEPTED_TYPES.includes(file.type) || (file.type === '' && ['heic', 'heif'].includes(ext));
  if (!typeOk) return 'Formato no permitido. Usa JPG, PNG, WEBP o HEIC.';
  if (file.size > MAX_IMAGE_BYTES) return 'La imagen supera 10 MB. Elige una más liviana.';
  if (file.size === 0) return 'El archivo está vacío.';
  return null;
}

/**
 * La imagen NO se sube a ningún servidor: se previsualiza localmente y solo se guarda
 * su nombre para recordarle al cliente que la envíe por WhatsApp.
 */
export function ReferenceImageInput({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  const onFile = (file: File | undefined) => {
    setError(null);
    if (!file) return;
    const problem = validateReferenceImage(file);
    if (problem) {
      setError(problem);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setPreview(file.type.startsWith('image/') && !file.type.includes('hei') ? URL.createObjectURL(file) : null);
    onChange(file.name.replace(/[^\w.\- ()áéíóúñÁÉÍÓÚÑ]/g, '_').slice(0, 80));
  };

  const clear = () => {
    setPreview(null);
    setError(null);
    onChange('');
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="field">
      <span className="field__label" id={`${id}-label`}>
        Imagen de referencia <span className="field__optional">(opcional)</span>
      </span>
      <div className="upload">
        <input ref={inputRef} id={id} type="file" accept={ACCEPTED_TYPES.join(',')} className="upload__input" onChange={(e) => onFile(e.target.files?.[0])} aria-labelledby={`${id}-label`} aria-describedby={`${id}-help ${id}-err`} />
        <label htmlFor={id} className="upload__btn">
          <Icon name="image" /> {value ? 'Cambiar imagen' : 'Elegir imagen'}
        </label>
        {value ? (
          <div className="upload__chosen">
            {preview ? <img src={preview} alt="Vista previa de la imagen elegida" className="upload__thumb" /> : <Icon name="image" size={28} />}
            <span className="upload__name">{value}</span>
            <button type="button" className="btn btn--ghost btn--sm" onClick={clear}>
              Quitar
            </button>
          </div>
        ) : null}
      </div>
      <p id={`${id}-help`} className="field__help">
        JPG, PNG, WEBP o HEIC, máximo 10 MB. La imagen no se sube a la página: al abrir WhatsApp te recordaremos enviarla en el chat.
      </p>
      <p id={`${id}-err`} className="field__error" role={error ? 'alert' : undefined}>
        {error}
      </p>
    </div>
  );
}
