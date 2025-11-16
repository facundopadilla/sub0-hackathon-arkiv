# 🔧 Fix: Moderación Mostrando 0 Proyectos - BACKEND

## ❌ Problema

La pestaña de **Moderación** mostraba 0 proyectos, cuando debería mostrar todos los **"submitted"** (pendientes).

### Causa Raíz

Cuando un usuario enviaba un proyecto, se guardaba directamente con estado **"approve"** (la decisión del AI), en lugar de guardarse como **"submitted"** (pendiente de moderación).

```python
# ANTES (INCORRECTO):
"status": payload.decision,  # ← "approve", "reject", o "borderline"

# RESULTADO:
# - Moderación: 0 proyectos (ninguno en estado "submitted")
# - Arkiv: todos los proyectos (pero deberían estar solo aprobados)
```

---

## ✅ Solución

Cambiar el endpoint `/sponsor` para que **siempre** guarde los proyectos con estado **"submitted"**:

### **Archivo**: `src/routes/v1/arkiv.py`

```python
@router.post("/sponsor")
async def save_sponsor(payload: SponsorRequest, ...):
    # ...
    data = {
        "project_id": project.get("project_id", ""),
        "name": project.get("name", ""),
        "repo": project.get("repo", ""),
        "ai_score": payload.ai_score,
        "status": "submitted",  # ← Siempre "submitted" inicialmente
        "contract_address": payload.contract_address,
        # ...
    }
```

---

## 📊 Flujo Correcto Ahora

### **Paso 1: Usuario Envía Proyecto**

```
Frontend: Llama submitProject()
Backend: POST /sponsor
Backend: Guarda con status="submitted"
DB: SponsoredProject { status: "submitted", ai_score: X, ... }
Frontend: Notificación de éxito
```

### **Paso 2: Moderador Revisa**

```
Frontend: Ve pestaña "Moderación"
Backend: GET /sponsored?status_filter=submitted
DB: Retorna todos los proyectos con status="submitted"
Frontend: Muestra lista de pendientes ✅
```

### **Paso 3: Moderador Reevalúa (Opcional)**

```
Frontend: Click "⚡ Reevaluar con AI"
Backend: POST /evaluate?project_id=1
Backend: Calcula nuevo AI score
Frontend: PUT /sponsored/1 { ai_score: 0.85, status: ... }
Backend: Actualiza en BD
Frontend: Score se actualiza ✅
```

### **Paso 4: Moderador Aprueba/Rechaza**

```
Frontend: Click "✅ Aprobar" o "❌ Rechazar"
Backend: PUT /sponsored/1 { status: "approved" o "rejected" }
DB: SponsoredProject { status: "approved", ... }
```

### **Paso 5: Proyectos Aprobados en Arkiv**

```
Frontend: Ve pestaña "Proyectos en Arkiv"
Backend: GET /sponsored?status_filter=approved
DB: Retorna solo proyectos aprobados
Frontend: Muestra proyectos en producción ✅
```

---

## 🎯 Estados de Proyectos

```
┌─────────────────────────────────────────────┐
│         Ciclo de Vida de Proyectos         │
├─────────────────────────────────────────────┤
│                                             │
│  1. Usuario Envía                           │
│     └─> status = "submitted"                │
│                                             │
│  2. Moderación (Pestaña: Moderación)        │
│     ├─> Ver proyecto                        │
│     ├─> Reevaluar con AI (opcional)         │
│     └─> Aprobar o Rechazar                  │
│                                             │
│  3. Si Aprobado                             │
│     ├─> status = "approved"                 │
│     ├─> Aparece en Arkiv                    │
│     └─> Va a Producción                     │
│                                             │
│  4. Si Rechazado                            │
│     └─> status = "rejected"                 │
│         (No aparece en ningún lado)         │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 📊 Visibilidad por Pestaña

| Pestaña             | Estados Mostrados | Función            |
| ------------------- | ----------------- | ------------------ |
| **Moderación**      | submitted         | Revisar pendientes |
| **Proyectos Arkiv** | approved          | Ver en producción  |

---

## 🧪 Testing

### Test 1: Enviar Proyecto

1. Ve a "Enviar Proyecto"
2. Completa el formulario
3. Click "Enviar a Evaluación"
4. **Resultado**: Notificación de éxito ✅

### Test 2: Ver en Moderación

1. Ve a "Moderación"
2. **Resultado**: Debería ver el proyecto recién enviado ✅
3. Status debe ser "submitted"

### Test 3: Moderar Proyecto

1. Selecciona proyecto en Moderación
2. Lee detalles
3. Click "✅ Aprobar Proyecto"
4. Proyecto desaparece de Moderación
5. **Resultado**: Proyecto aparece en "Proyectos en Arkiv" ✅

### Test 4: Verificar en Arkiv

1. Ve a "Proyectos en Arkiv"
2. **Resultado**: Ver proyecto aprobado ✅

---

## 📝 Changelog

```
✅ fix: Moderación mostraba 0 proyectos - Backend

src/routes/v1/arkiv.py:
- Cambiar "status": payload.decision
  a "status": "submitted"
- Ahora todos los proyectos nuevos se guardan como "submitted"
- Moderadores pueden ver y revisar en pestaña "Moderación"
- Al aprobar, cambia a "approved" y aparece en "Proyectos Arkiv"
```

---

## 🚀 Resultado Final

- ✅ Moderación muestra proyectos "submitted"
- ✅ Arkiv muestra solo proyectos "approved"
- ✅ Flujo de moderación funciona correctamente
- ✅ Estados se manejan correctamente

**Sistema de moderación totalmente funcional** 🎉
