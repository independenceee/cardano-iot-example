/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Head from "next/head";
import {
  Check,
  MapPin,
  Truck,
  Watch,
  Factory,
  Ship,
  Calendar,
  BadgeCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { getTracking } from "@/actions/tracking";

export default function ProductTraceabilityPage() {
  const params = useParams();
  const unit = params.id as string;

  const {
    data: tracking,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["product-tracking", unit],
    queryFn: () => getTracking({ unit }),
    enabled: !!unit,
  });

  const [selectedStep, setSelectedStep] = React.useState(0);

  const waypoints = React.useMemo(() => {
    const roadmapStr = tracking?.metadata?.roadmap || "";
    return roadmapStr
      .replace(/[\[\]]/g, "")
      .split(",")
      .map((w: any) => w.trim())
      .filter(Boolean);
  }, [tracking]);

  const transactionLocations = React.useMemo(
    () =>
      tracking?.transaction_history
        .map((t) => t.metadata?.location)
        .filter(Boolean) || [],
    [tracking],
  );

  const currentLocation = tracking?.metadata?.location || waypoints[0] || "";
  const currentIndex = waypoints.indexOf(currentLocation);

  React.useEffect(() => {
    if (currentIndex >= 0) {
      setSelectedStep(currentIndex);
    }
  }, [currentIndex]);

  const selectedTx = tracking?.transaction_history.find(
    (tx) => tx.metadata?.location === waypoints[selectedStep],
  );

  const iconForLocation = (loc: string) => {
    const lower = loc.toLowerCase();
    if (lower.includes("ha noi")) return <Factory className="w-7 h-7" />;
    if (lower.includes("hung yen") || lower.includes("hai duong"))
      return <Truck className="w-7 h-7" />;
    if (lower.includes("hai phong")) return <Ship className="w-7 h-7" />;
    return <Watch className="w-7 h-7" />;
  };

  const productMeta = tracking?.metadata;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center backdrop-blur-xl bg-white/10 p-8 rounded-3xl border border-white/20">
          <Loader2 className="w-16 h-16 animate-spin text-blue-400 mx-auto mb-6" />
          <p className="text-lg text-white font-medium">
            Đang truy xuất dữ liệu blockchain...
          </p>
          <p className="text-sm text-blue-200 mt-2">Vui lòng chờ một chút</p>
        </div>
      </div>
    );
  }

  if (isError || !tracking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="text-center max-w-md p-8 bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Không thể tải dữ liệu
          </h2>
          <p className="text-blue-100 mb-4">
            {error?.message || "Có lỗi xảy ra khi kết nối với blockchain."}
          </p>
          <p className="text-sm text-blue-200">
            Vui lòng thử lại sau hoặc kiểm tra mã sản phẩm.
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50 text-gray-800 relative overflow-hidden">
      <Head>
        <title>Traceability | {productMeta?.model || "Product"}</title>
      </Head>

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-200 rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20 blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 relative z-10">
        {/* Header */}
        <div className="text-center mb-20 md:mb-28">
          <div className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-full mb-8 border border-indigo-200/60 shadow-sm hover:shadow-md transition-shadow">
            <BadgeCheck className="w-5 h-5 text-indigo-600 animate-pulse" />
            <span className="text-indigo-700 font-semibold text-sm">
              Verified on Cardano Blockchain
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
            <span className="block text-gray-900">Product</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 block">
              Traceability
            </span>
          </h1>

          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent mx-auto mb-8"></div>

          <div className="mt-8 max-w-3xl mx-auto space-y-4">
            <p className="text-2xl md:text-3xl text-gray-800 font-bold">
              {productMeta?.model || "Unknown Model"}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm md:text-base text-gray-700 font-medium">
              <span className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-full shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span>{waypoints[0] || "Origin"}</span>
              </span>
              <span className="hidden sm:inline text-indigo-400 text-lg">
                →
              </span>
              <span className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-full shadow-sm ring-2 ring-blue-400/50">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
                <span className="font-semibold text-gray-900">
                  {currentLocation}
                </span>
              </span>
              <span className="hidden sm:inline text-indigo-400 text-lg">
                →
              </span>
              <span className="inline-flex items-center gap-2.5 px-3 py-1.5 bg-white rounded-full shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span>{waypoints[waypoints.length - 1] || "Destination"}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-24 md:mb-32">
          <div className="text-center mb-10 md:mb-14">
            <h2 className="text-4xl md:text-5xl font-bold mb-3 text-gray-900">
              Supply Chain Journey
            </h2>
            <p className="text-gray-600 text-lg">
              Track the product through each checkpoint
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 md:p-12 shadow-xl border border-gray-100 hover:shadow-2xl transition-shadow">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 overflow-x-auto pb-4">
              {waypoints.map((loc: any, index: number) => {
                const isPast = index < currentIndex;
                const isCurrent = index === currentIndex;
                const hasTx = transactionLocations.includes(loc);

                return (
                  <div
                    key={loc}
                    className="relative flex flex-col items-center flex-shrink-0"
                  >
                    <div
                      onClick={() => {
                        if (hasTx) setSelectedStep(index);
                      }}
                      className={cn(
                        "transition-all duration-300",
                        hasTx
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-50",
                      )}
                    >
                      <div
                        className={cn(
                          "w-24 h-24 rounded-full flex items-center justify-center border-2 shadow-lg transition-all duration-300 relative",
                          isPast
                            ? "bg-gradient-to-br from-green-400 to-green-500 border-green-300 text-white shadow-green-500/30"
                            : isCurrent
                              ? "bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-300 text-white scale-125 shadow-2xl shadow-blue-500/40 ring-4 ring-blue-200/50"
                              : "bg-gray-50 border-gray-300 text-gray-400 shadow-gray-200/50",
                          hasTx &&
                            !isCurrent &&
                            "hover:scale-110 hover:shadow-2xl",
                        )}
                      >
                        {isPast || isCurrent ? (
                          <div className="absolute inset-0 rounded-full bg-white/10"></div>
                        ) : null}
                        <span className="relative z-10">
                          {isPast ? (
                            <Check className="w-10 h-10" />
                          ) : (
                            iconForLocation(loc)
                          )}
                        </span>
                      </div>

                      <div className="mt-6 text-center max-w-xs mx-auto">
                        <p
                          className={cn(
                            "font-semibold text-sm leading-tight",
                            index <= currentIndex
                              ? "text-gray-900"
                              : "text-gray-500",
                          )}
                        >
                          {loc}
                        </p>
                        <p className="text-xs text-gray-500 mt-1.5">
                          {hasTx ? "✓ Ghi nhận" : "Chờ xác nhận"}
                        </p>
                      </div>
                    </div>

                    {index < waypoints.length - 1 && (
                      <div
                        className={cn(
                          "h-1.5 hidden md:block transition-all duration-300 mx-3 mt-8",
                          index < currentIndex
                            ? "w-16 bg-gradient-to-r from-green-400 to-blue-400"
                            : "w-16 bg-gray-300",
                        )}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {/* Current Stage */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-indigo-600" />
              </div>
              Current Stage
            </h3>

            {selectedTx ? (
              <div className="space-y-5">
                <div className="flex gap-3 p-4 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-semibold">
                      Timestamp
                    </p>
                    <p className="text-gray-800 font-medium">
                      {new Date(selectedTx.datetime * 1000).toLocaleString(
                        "vi-VN",
                        {
                          dateStyle: "long",
                          timeStyle: "short",
                        },
                      )}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Action
                  </p>
                  <p className="text-lg text-gray-800 font-medium">
                    {selectedTx.action}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Status
                  </p>
                  <span className="inline-block px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                    {selectedTx.status}
                  </span>
                </div>
                <div className="pt-2">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-2">
                    Transaction Hash
                  </p>
                  <Link href={`https://preprod.cexplorer.io/tx/${selectedTx.txHash}`} target="_blank" className="text-xs text-gray-700 font-mono bg-gray-100 p-3 rounded-lg break-all">
                    {selectedTx.txHash}
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 italic">
                Chưa có giao dịch nào được ghi nhận cho giai đoạn này.
              </p>
            )}
          </div>

          {/* Transaction History */}
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-gray-100 hover:shadow-2xl transition-all duration-300">
            <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Watch className="w-5 h-5 text-blue-600" />
              </div>
              Transfer History
            </h3>

            {tracking.transaction_history.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {tracking.transaction_history.map((tx, i) => (
                  <div
                    key={tx.txHash}
                    onClick={() => {
                      setSelectedStep(
                        waypoints.indexOf(tx.metadata?.location || "")
                      );
                    }}
                    className="p-5 bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl border border-gray-100 hover:border-blue-200 hover:shadow-md hover:from-gray-50 hover:to-indigo-50 transition-all duration-200 cursor-pointer group"
                  >
                    <div className="flex justify-between items-start gap-3 mb-2.5">
                      <p className="font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors flex-1">
                        {tx.metadata?.location || "Unknown Location"}
                      </p>
                      <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex-shrink-0 mt-1 shadow-sm"></span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2 font-medium">
                      {new Date(tx.datetime * 1000).toLocaleString("vi-VN")}
                    </p>
                    <p className="text-sm text-gray-700 font-semibold mb-2">
                      {tx.action}
                    </p>
                    <p className="text-xs text-gray-600 font-mono truncate opacity-75">
                      {tx.txHash.slice(0, 20)}...
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8 italic">
                Chưa có lịch sử giao dịch.
              </p>
            )}
          </div>
        </div>

        {productMeta && (
          <div className="mt-16 mb-12">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 md:p-16 shadow-xl border border-gray-100">
              <h3 className="text-4xl md:text-5xl font-black mb-3 text-center text-gray-900">
                Product Information
              </h3>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent mx-auto mb-10"></div>
              <p className="text-center text-gray-600 mb-12 text-lg">
                Verified on-chain metadata
              </p>

              <div className="grid md:grid-cols-2 gap-6 mb-10">
                <div className="group p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-indigo-100/50 hover:border-indigo-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <p className="text-xs uppercase font-bold text-indigo-600 tracking-wide mb-3">
                    Brand
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {productMeta.brand || "—"}
                  </p>
                </div>
                <div className="group p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-indigo-100/50 hover:border-indigo-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <p className="text-xs uppercase font-bold text-indigo-600 tracking-wide mb-3">
                    Model
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {productMeta.model || "—"}
                  </p>
                </div>
                <div className="group p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-indigo-100/50 hover:border-indigo-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <p className="text-xs uppercase font-bold text-indigo-600 tracking-wide mb-3">
                    Material
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {productMeta.material || "—"}
                  </p>
                </div>
                <div className="group p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl border border-indigo-100/50 hover:border-indigo-300 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <p className="text-xs uppercase font-bold text-indigo-600 tracking-wide mb-3">
                    Battery
                  </p>
                  <p className="text-lg font-bold text-gray-900">
                    {productMeta.battery || "—"}
                  </p>
                </div>
              </div>

              {productMeta.description && (
                <div className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl border border-gray-100 shadow-md">
                  <p className="text-xs uppercase font-bold text-gray-600 tracking-wide mb-4">
                    Description
                  </p>
                  <p className="text-gray-800 leading-relaxed text-base font-medium">
                    {productMeta.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
