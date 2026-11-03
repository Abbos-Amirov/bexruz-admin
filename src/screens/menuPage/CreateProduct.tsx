import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
} from "@mui/material";
import CloudUploadOutlinedIcon from "@mui/icons-material/CloudUploadOutlined";
import {
  ProductCollection,
  ProductDialogMode,
  ProductSize,
  ProductVolume,
} from "../../lib/enums/product.enums";
import { Product, ProductFormValues } from "../../lib/types/product";
import { imageBaseUrl } from "../../lib/config";

interface ProductDialogProps {
  mode: ProductDialogMode;
  open: boolean;
  onClose: () => void;
  onSubmit: (fd: FormData, id?: string) => Promise<void>;
  initialValues?: Product;
}

const SLOT_COUNT = 5;
const ALLOWED_IMAGE_MIME = new Set(["image/jpeg", "image/png"]);
const ALLOWED_IMAGE_EXT = [".jpg", ".jpeg", ".png"];

const EMPTY: ProductFormValues = {
  productName: "",
  productPrice: "",
  productLeftCount: "",
  productCollection: ProductCollection.DISH,
  productSize: ProductSize.NORMAL,
  productVolume: undefined,
  productDesc: "",
  existingUrls: [],
  newFiles: [],
};

const VOLUME_OPTIONS: ProductVolume[] = [
  ProductVolume.HALF,
  ProductVolume.ONE,
  ProductVolume.ONE_POINT_TWO,
  ProductVolume.ONE_POINT_FIVE,
  ProductVolume.TWO,
];

// One source of truth for validation
function getErrors(form: ProductFormValues) {
  const e: Record<string, string> = {};
  const isDrink = form.productCollection === ProductCollection.DRINK;

  if (!form.productName.trim()) e.productName = "Required";

  const priceNum = Number(form.productPrice);
  if (form.productPrice === "" || Number.isNaN(priceNum) || priceNum < 0) {
    e.productPrice = "Invalid";
  }

  const countNum = Number(form.productLeftCount);
  if (
    form.productLeftCount === "" ||
    Number.isNaN(countNum) ||
    !Number.isInteger(countNum) ||
    countNum < 0
  ) {
    e.productLeftCount = "Integer only";
  }

  if (!form.productDesc.trim()) e.productDesc = "Required";

  if (form.existingUrls.length + form.newFiles.length === 0) {
    e.productImages = "At least one image";
  }

  if (isDrink ? !form.productVolume : !form.productSize) {
    e.spec = "Required";
  }

  return e;
}

export default function ProductDialog(props: ProductDialogProps) {
  const { t } = useTranslation();
  const { mode, open, onClose, onSubmit, initialValues } = props;

  const [form, setForm] = useState<ProductFormValues>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const isDrink = form.productCollection === ProductCollection.DRINK;

  // Prefill on open (edit) or reset (create)
  useEffect(() => {
    if (!open) return;

    if (mode === ProductDialogMode.EDIT && initialValues) {
      setForm({
        productName: initialValues.productName ?? "",
        productPrice: String(initialValues.productPrice ?? ""),
        productLeftCount: String(initialValues.productLeftCount ?? ""),
        productCollection:
          initialValues.productCollection ?? ProductCollection.DISH,
        productSize: initialValues.productSize,
        productVolume: initialValues.productVolume,
        productDesc: initialValues.productDesc ?? "",
        existingUrls: initialValues.productImages ?? [],
        newFiles: [],
      });
    } else {
      setForm(EMPTY);
    }
    setErrors({});
  }, [open, mode, initialValues]);

  // Build blob URLs only from new files
  const fileUrls = useMemo(
    () => form.newFiles.map((f) => URL.createObjectURL(f)),
    [form.newFiles]
  );

  // Revoke blob URLs when they change (and on unmount)
  useEffect(() => {
    return () => {
      fileUrls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [fileUrls]);

  // Final previews: existing URLs + blob URLs (capped)
  const previews: string[] = useMemo(
    () => [...form.existingUrls, ...fileUrls].slice(0, SLOT_COUNT),
    [form.existingUrls, fileUrls]
  );

  const resolvePreviewSrc = (s: string) => {
    if (!s) return "";
    if (s.startsWith("blob:") || s.startsWith("data:")) return s;
    if (s.startsWith("http://") || s.startsWith("https://")) return s;
    return `${imageBaseUrl}/${s}`;
  };

  // Derive canSubmit from the same validation logic (no state writes here)
  const canSubmit = useMemo(
    () => Object.keys(getErrors(form)).length === 0,
    [form]
  );

  // Generic setter
  const setField =
    <K extends keyof ProductFormValues>(k: K) =>
    (v: ProductFormValues[K]) =>
      setForm((p) => ({ ...p, [k]: v }));

  const triggerPick = (slotIndex: number) =>
    inputsRef.current[slotIndex]?.click();

  const onFilePick = (slotIndex: number, f: File | null) => {
    if (!f) return;
    const lowerName = String(f.name || "").toLowerCase();
    const hasAllowedExt = ALLOWED_IMAGE_EXT.some((ext) =>
      lowerName.endsWith(ext)
    );
    const hasAllowedMime =
      !f.type || ALLOWED_IMAGE_MIME.has(String(f.type).toLowerCase());
    if (!(hasAllowedExt || hasAllowedMime)) {
      setErrors((prev) => ({ ...prev, productImages: t("errors.imageFormat") }));
      return;
    }

    setForm((p) => {
      const used = p.existingUrls.length + p.newFiles.length;
      if (used >= SLOT_COUNT) return p;
      return { ...p, newFiles: [...p.newFiles, f] };
    });
    setErrors((prev) => ({ ...prev, productImages: "" }));
  };

  // Remove (click an image): remove from existing first, then new files
  const removeAt = (slotIndex: number) => {
    const urlCount = form.existingUrls.length;
    if (slotIndex < urlCount) {
      setForm((p) => ({
        ...p,
        existingUrls: p.existingUrls.filter((_, i) => i !== slotIndex),
      }));
    } else {
      const fileIdx = slotIndex - urlCount;
      setForm((p) => ({
        ...p,
        newFiles: p.newFiles.filter((_, i) => i !== fileIdx),
      }));
    }
  };

  const submit = async () => {
    const e = getErrors(form);
    setErrors(e);
    if (Object.keys(e).length) return;

    const fd = new FormData();
    fd.append("productName", form.productName.trim());
    fd.append("productPrice", String(Number(form.productPrice)));
    fd.append("productLeftCount", String(Number(form.productLeftCount)));
    fd.append("productCollection", form.productCollection);

    if (isDrink) {
      fd.append("productVolume", String(form.productVolume));
    } else {
      fd.append("productSize", String(form.productSize));
    }

    fd.append("productDesc", form.productDesc.trim());

    // EDIT: keep existing urls; CREATE: none (array empty)
    form.existingUrls.forEach((u) => fd.append("existingImages", u));
    // upload new files
    form.newFiles.forEach((f) => fd.append("productImages", f));

    const id = mode === ProductDialogMode.EDIT ? initialValues?._id : undefined;
    try {
      await onSubmit(fd, id);
      onClose();
    } catch (err) {
      // keep dialog open so user can fix input and retry
    }
  };

  return (
    <Dialog
      className="dialog"
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle
        sx={{
          textAlign: "center",
          fontWeight: 700,
          letterSpacing: 1,
          fontSize: "24px",
        }}
      >
        {mode === ProductDialogMode.CREATE
          ? t("menu.newProduct")
          : t("menu.editProduct")}
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "background.default", py: 3 }}>
        <Box sx={{ maxWidth: 980, mx: "auto" }}>
          <Grid container spacing={3}>
            {/* Name */}
            <Grid item xs={12}>
              <Typography className="sub-title">{t("menu.productName")}</Typography>
              <TextField
                fullWidth
                placeholder={t("menu.name")}
                value={form.productName}
                onChange={(e) => setField("productName")(e.target.value)}
                error={!!errors.productName}
                helperText={errors.productName}
                sx={{ bgcolor: "white" }}
              />
            </Grid>

            {/* Price / Left Count */}
            <Grid item xs={12} md={6}>
              <Typography className="sub-title">{t("menu.productPrice")}</Typography>
              <TextField
                fullWidth
                placeholder={t("menu.price")}
                type="number"
                value={form.productPrice}
                onChange={(e) => setField("productPrice")(e.target.value)}
                error={!!errors.productPrice}
                helperText={errors.productPrice}
                inputProps={{ min: 0, step: "0.01" }}
                sx={{ bgcolor: "white" }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography className="sub-title">{t("menu.productLeftCount")}</Typography>
              <TextField
                fullWidth
                placeholder={t("menu.counts")}
                type="number"
                value={form.productLeftCount}
                onChange={(e) => setField("productLeftCount")(e.target.value)}
                error={!!errors.productLeftCount}
                helperText={errors.productLeftCount}
                inputProps={{ min: 0, step: 1 }}
                sx={{ bgcolor: "white" }}
              />
            </Grid>

            {/* Collection / Size or Volume */}
            <Grid item xs={12} md={6}>
              <Typography className="sub-title">{t("menu.productType")}</Typography>
              <FormControl fullWidth sx={{ bgcolor: "white" }}>
                <Select
                  value={form.productCollection}
                  onChange={(e) => {
                    const val = e.target.value as ProductCollection;
                    setForm((p) => ({
                      ...p,
                      productCollection: val,
                      productSize:
                        val === ProductCollection.DRINK
                          ? undefined
                          : p.productSize ?? ProductSize.NORMAL,
                      productVolume:
                        val === ProductCollection.DRINK
                          ? p.productVolume ?? ProductVolume.ONE
                          : undefined,
                    }));
                  }}
                  displayEmpty
                >
                  <MenuItem value={ProductCollection.DISH}>DISH</MenuItem>
                  <MenuItem value={ProductCollection.DRINK}>DRINK</MenuItem>
                  <MenuItem value={ProductCollection.DESSERT}>DESSERT</MenuItem>
                  <MenuItem value={ProductCollection.SALAD}>SALAD</MenuItem>
                  <MenuItem value={ProductCollection.OTHER}>OTHER</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography className="sub-title">
                {isDrink ? "Volume" : "Size"}
              </Typography>
              <FormControl fullWidth sx={{ bgcolor: "white" }}>
                <Select
                  value={
                    isDrink ? form.productVolume ?? "" : form.productSize ?? ""
                  }
                  onChange={(e) => {
                    if (isDrink) {
                      setField("productVolume")(
                        Number(e.target.value) as ProductVolume
                      );
                    } else {
                      setField("productSize")(e.target.value as ProductSize);
                    }
                  }}
                  displayEmpty
                >
                  {isDrink
                    ? VOLUME_OPTIONS.map((v) => (
                        <MenuItem key={v} value={v}>
                          {v} litre
                        </MenuItem>
                      ))
                    : [
                        ProductSize.SMALL,
                        ProductSize.NORMAL,
                        ProductSize.LARGE,
                        ProductSize.SET,
                      ].map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="error">
                {errors.spec}
              </Typography>
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <Typography className="sub-title">{t("menu.productDescription")}</Typography>
              <TextField
                fullWidth
                multiline
                minRows={6}
                value={form.productDesc}
                onChange={(e) => setField("productDesc")(e.target.value)}
                error={!!errors.productDesc}
                helperText={errors.productDesc}
                sx={{ bgcolor: "white" }}
              />
            </Grid>

            {/* Images (5 slots) */}
            <Grid item xs={12}>
              <Typography className="sub-title">{t("menu.productImages")}</Typography>
              <Box
                sx={{
                  display: "flex",
                  gap: 3,
                  flexWrap: "wrap",
                  justifyContent: "center",
                  mt: "5px",
                }}
              >
                {Array.from({ length: SLOT_COUNT }).map((_, i) => {
                  const src = previews[i] || null;
                  return (
                    <Box
                      key={i}
                      onClick={() => (src ? removeAt(i) : triggerPick(i))}
                      className="images"
                      sx={{
                        width: 120,
                        height: 120,
                        borderRadius: 4,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "background.paper",
                        border: "1px dashed",
                        borderColor: "divider",
                        overflow: "hidden",
                      }}
                      title={src ? t("menu.clickToRemove") : t("menu.clickToAdd")}
                    >
                      {src ? (
                        <img
                          src={resolvePreviewSrc(previews[i])}
                          alt={`preview-${i}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            borderRadius: 4,
                          }}
                        />
                      ) : (
                        <CloudUploadOutlinedIcon
                          sx={{ fontSize: 44, color: "primary.main" }}
                        />
                      )}
                      <input
                        ref={(el) => (inputsRef.current[i] = el)}
                        type="file"
                        hidden
                        accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                        onChange={(e) => {
                          onFilePick(i, e.target.files?.[0] ?? null);
                          // allow selecting the same file again
                          e.currentTarget.value = "";
                        }}
                      />
                    </Box>
                  );
                })}
              </Box>
              {errors.productImages && (
                <Typography variant="caption" color="error">
                  {errors.productImages}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="error" variant="contained" onClick={onClose}>
          {t("common.cancel")}
        </Button>
        <Button
          color="primary"
          variant="contained"
          onClick={submit}
          disabled={!canSubmit}
        >
          {mode === ProductDialogMode.CREATE ? t("menu.create") : t("menu.update")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
