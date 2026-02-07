"use client";

import { useState, useEffect } from "react";
import QRCode from "qrcode";
import { QrCode, Download, ExternalLink, Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Create() {
  const [form, setForm] = useState({
    issuer: "",
    productName: "",
  });
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [productUrl, setProductUrl] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    setQrCodeUrl(null);
    setFormError(null);

    if (submitted) {
      setSubmitted(false);
      setProductId(null);
      setProductUrl(null);
    }
  };

  const { data: productData, isLoading, isFetching, error } = useQuery({
    queryKey: ["product", form.issuer.trim(), form.productName.trim()],
    queryFn: async () => {
      const res = await fetch(`/api/product?issuer_address=${form.issuer.trim()}&product_name=${encodeURIComponent(form.productName.trim())}`);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Không tìm thấy sản phẩm trên blockchain");
      }
      return res.json(); 
    },
    enabled: submitted && !!form.issuer.trim() && !!form.productName.trim(),
    retry: 1,
    staleTime: 300_000,
  });

  useEffect(() => {
    if (!productData || !submitted) return;

    const encoder = new TextEncoder();
    const nameBytes = encoder.encode(form.productName.trim());
    if (nameBytes.length > 32) {
      setFormError("Tên sản phẩm quá dài (tối đa 32 bytes theo chuẩn Cardano)");
      return;
    }

    const policyId = productData.policyId as string;

    // Prefer assetNameHex from API if available, otherwise compute
    let assetNameHex = productData.assetNameHex;
    if (!assetNameHex) {
      assetNameHex = Array.from(nameBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
    }

    // Most common for CIP-68 reference/user tokens: label 100 = "000643b0"
    const cip68Label = "000643b0";
    const assetUnit = policyId + cip68Label + assetNameHex;

    const id = assetUnit;
    setProductId(id);

    const url = `${window.location.origin}/product/${id}`;
    setProductUrl(url);

    QRCode.toDataURL(url, {
      errorCorrectionLevel: "H",
      width: 512,
      margin: 4,
      color: { dark: "#1e293b", light: "#ffffff" },
    })
      .then(setQrCodeUrl)
      .catch(err => {
        console.error(err);
        setFormError("Lỗi tạo mã QR");
      });
  }, [productData, submitted, form.productName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const issuer = form.issuer.trim();
    const name = form.productName.trim();

    if (!issuer || !name) return;

    setFormError(null);
    setSubmitted(true);
  };

  const isProcessing = submitted && (isLoading || isFetching || !qrCodeUrl);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 py-12 px-6 relative overflow-hidden">
      {/* Background decoration giữ nguyên */}

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header giữ nguyên */}

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Form */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/50">
            <form onSubmit={handleSubmit} className="space-y-7">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Policy ID <span className="text-red-500">*</span>
                </label>
                <input
                  name="issuer"
                  type="text"
                  required
                  value={form.issuer}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 bg-white border ${
                    formError ? "border-red-500" : "border-slate-200"
                  } rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all`}
                  placeholder="Ví dụ: 0e14267a8020229adc0184dd25fa3174c3f7d6caadcb4425c70e7c04"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Tên sản phẩm <span className="text-red-500">*</span>
                </label>
                <input
                  name="productName"
                  type="text"
                  required
                  value={form.productName}
                  onChange={handleChange}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                  placeholder="Ví dụ: Huawei Watch GT 4 Pro"
                />
              </div>

              {formError && (
                <p className="text-red-600 text-center font-medium bg-red-50 py-3 rounded-xl">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white font-bold text-lg rounded-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {isProcessing ? (
                  <>Đang xử lý...</>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6" />
                    Tạo QR Code
                  </>
                )}
              </button>
            </form>
          </div>

          {/* QR Preview */}
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/50 flex flex-col items-center justify-center">
            {qrCodeUrl ? (
              <div className="text-center space-y-8">
                <div>
                  <p className="text-lg font-medium text-slate-600 mb-2">
                    Product ID (policy + asset name)
                  </p>
                  <p className="text-xl font-bold text-blue-600 font-mono tracking-wider break-all">
                    {productId}
                  </p>
                </div>

                <div className="p-6 bg-white rounded-2xl shadow-inner">
                  <img
                    src={qrCodeUrl}
                    alt="QR Code"
                    className="w-80 h-80 mx-auto"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={qrCodeUrl}
                    download={`QR_${productId?.replace(/[^a-zA-Z0-9]/g, "_") || "sanpham"}.png`}
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                    Tải QR
                  </a>

                  <a
                    href={productUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-slate-700 to-slate-800 text-white font-semibold rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Xem trang sản phẩm
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center max-w-md">
                <div className="w-64 h-64 mx-auto bg-gradient-to-br from-blue-100 to-emerald-100 rounded-3xl flex items-center justify-center mb-8">
                  <QrCode className="w-32 h-32 text-blue-400" />
                </div>
                <p className="text-xl font-medium text-slate-600">
                  Nhập Policy ID và Tên sản phẩm rồi nhấn nút
                </p>
                <p className="text-slate-500 mt-4">
                  QR sẽ dẫn trực tiếp đến trang sản phẩm trên website
                </p>

                {error && (
                  <p className="mt-6 text-red-600 font-medium">
                    {error instanceof Error ? error.message : "Có lỗi xảy ra"}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}