import React, { ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Box, Button, IconButton, Paper, Stack, Typography } from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import Pagination from "@mui/material/Pagination";
import PaginationItem from "@mui/material/PaginationItem";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import {
  Product,
  ProductInquiry,
  ProductUpdateInput,
} from "../../lib/types/product";
import { createSelector } from "@reduxjs/toolkit";
import { useSelector } from "react-redux";
import {
  ProductCollection,
  ProductDialogMode,
  ProductStatus,
} from "../../lib/enums/product.enums";
import { retrieveProducts } from "./selector";
import { imageBaseUrl } from "../../lib/config";

const productsRetriever = createSelector(retrieveProducts, (products) => ({
  products,
}));

interface ProdcutsPageProps {
  productSearch: ProductInquiry;
  setSearchText: (searchText: string) => void;
  searchCollectionHandler: (collection: ProductCollection) => void;
  searchOrderHandler: (order: string) => void;
  searchProductHandler: () => void;
  paginationHandler: (e: ChangeEvent<any>, value: number) => void;
  setMode: (mode: ProductDialogMode) => void;
  setOpen: (isOpen: boolean) => void;
  setEdit: (edit: Product | undefined) => void;
  productUpdateHandler: (input: ProductUpdateInput) => void;
  productDeleteHandler: (input: ProductUpdateInput) => void;
}

export default function ProductsPage(props: ProdcutsPageProps) {
  const { t } = useTranslation();
  const {
    productSearch,
    setSearchText,
    paginationHandler,
    searchOrderHandler,
    searchProductHandler,
    searchCollectionHandler,
    setEdit,
    setMode,
    setOpen,
    productDeleteHandler,
    productUpdateHandler,
  } = props;
  const { products } = useSelector(productsRetriever);

  const categories = [
    ProductCollection.ALL,
    ProductCollection.DISH,
    ProductCollection.DESSERT,
    ProductCollection.DRINK,
    ProductCollection.SALAD,
    ProductCollection.OTHER,
  ];
  const sorts = [
    { key: "createdAt", label: t("menu.new") },
    { key: "productPrice", label: t("menu.price") },
    { key: "productViews", label: t("menu.views") },
  ];

  return (
    <div className="admin-products-page">
      {/* Header */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        className="admin-products-header"
      >
        <Typography component="h1" className="bx-page-title" sx={{ mb: "0 !important" }}>
          {t("menu.menuItems")}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={() => {
            setMode(ProductDialogMode.CREATE);
            setOpen(true);
          }}
        >
          {t("menu.addNewProduct")}
        </Button>
      </Stack>

      {/* Toolbar: qidiruv, kategoriya, saralash */}
      <Paper className="admin-products-toolbar">
        <Box className="admin-products-search">
          <input
            type="search"
            name="singleResearch"
            placeholder={t("users.typeHere")}
            className="search-input"
            onChange={(e) => {
              setSearchText(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") searchProductHandler();
            }}
          />
          <Button
            variant="contained"
            color="primary"
            className="search-input-btn"
            endIcon={<SearchIcon />}
            onClick={searchProductHandler}
          >
            {t("menu.search")}
          </Button>
        </Box>

        <Box className="admin-products-chips">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={`bx-chip${productSearch.productCollection === item ? " active" : ""}`}
              onClick={() => searchCollectionHandler(item)}
            >
              {t(`menu.categories.${item}`, item)}
            </button>
          ))}
        </Box>

        <Box className="admin-products-sorts">
          {sorts.map((sort) => (
            <button
              type="button"
              key={sort.key}
              className={`bx-sort${productSearch.order === sort.key ? " active" : ""}`}
              onClick={() => searchOrderHandler(sort.key)}
            >
              {sort.label}
            </button>
          ))}
        </Box>
      </Paper>

      {/* Products grid */}
      {products.length !== 0 ? (
        <Box className="admin-products-grid">
          {products.map((product: Product) => {
            const firstImage = Array.isArray(product.productImages)
              ? product.productImages.find(
                  (img) => typeof img === "string" && img.trim() !== ""
                ) ?? ""
              : "";
            const imagePath = firstImage
              ? firstImage.startsWith("http://") || firstImage.startsWith("https://")
                ? firstImage
                : `${imageBaseUrl}/${firstImage}`.replace(/([^:]\/)\/+/g, "$1")
              : "";
            const sizeVolume =
              product.productCollection === ProductCollection.DRINK
                ? (product.productVolume ?? 0) + " L"
                : product.productSize ?? "NORMAL";
            const productStat = product.productStatus;
            const isActive = productStat === ProductStatus.PROCESS;
            return (
              <Paper
                key={product._id}
                className={`admin-product-card${isActive ? "" : " is-paused"}`}
              >
                <Box
                  className="admin-product-img"
                  sx={{ backgroundImage: imagePath ? `url(${imagePath})` : "none" }}
                >
                  <span className="admin-product-size">{sizeVolume}</span>
                  <span className={`admin-product-status${isActive ? " active" : ""}`}>
                    {isActive ? t("menu.statusActive") : t("menu.statusPaused")}
                  </span>
                </Box>
                <Box className="admin-product-body">
                  <Typography className="admin-product-name" title={product.productName}>
                    {product.productName}
                  </Typography>
                  <Typography className="admin-product-price">
                    ₩{Number(product.productPrice ?? 0).toLocaleString("en-US")}
                  </Typography>
                </Box>
                <Box className="admin-product-actions">
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton
                      size="small"
                      aria-label="edit"
                      className="admin-product-icon"
                      onClick={() => {
                        setMode(ProductDialogMode.EDIT);
                        setEdit(product);
                        setOpen(true);
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      aria-label="delete"
                      className="admin-product-icon danger"
                      onClick={() =>
                        productDeleteHandler({
                          _id: product._id,
                          productStatus: ProductStatus.DELETE,
                          productName: product.productName,
                        })
                      }
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Mark Available / Unavailable */}
                  <Button
                    variant={isActive ? "outlined" : "contained"}
                    color={isActive ? "secondary" : "success"}
                    size="small"
                    className="admin-product-toggle"
                    onClick={() =>
                      productUpdateHandler({
                        _id: product._id,
                        productStatus: isActive
                          ? ProductStatus.PAUSE
                          : ProductStatus.PROCESS,
                        existingImages: product.productImages,
                      })
                    }
                  >
                    {isActive ? t("menu.setPause") : t("menu.setProcess")}
                  </Button>
                </Box>
              </Paper>
            );
          })}
        </Box>
      ) : (
        <Box className="no-data">{t("menu.productsNotAvailable")}</Box>
      )}

      <Stack className="pagination-section">
        <Pagination
          count={
            products.length !== 0
              ? productSearch.page + 1
              : productSearch.page
          }
          page={productSearch.page}
          renderItem={(item) => (
            <PaginationItem
              slots={{
                previous: ArrowBackIcon,
                next: ArrowForwardIcon,
              }}
              {...item}
            />
          )}
          onChange={paginationHandler}
        />
      </Stack>
    </div>
  );
}
