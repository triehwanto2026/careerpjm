import PublicLayout from "@/components/layout/PublicLayout";
import { Building2, Target, Trophy, Users, Award, Globe, Heart, Zap } from "lucide-react";
import { motion } from "framer-motion";

const About = () => {
  return (
    <PublicLayout>
      <div className="container py-16 md:py-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Tentang PJM Group</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Membangun masa depan melalui inovasi dan kolaborasi yang berkelanjutan
          </p>
        </motion.div>

        {/* Vision & Mission */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="card-elevated p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Visi</h2>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Menjadi perusahaan terdepan dalam penyediaan solusi rekrutmen dan pengembangan SDM yang terintegrasi, berorientasi teknologi, dan berfokus pada kualitas untuk mendukung pertumbuhan bisnis di Indonesia.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="card-elevated p-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Misi</h2>
            </div>
            <ul className="text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Menyediakan platform rekrutmen yang modern dan efisien</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Menghubungkan talent terbaik dengan perusahaan yang tepat</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Mendukung pengembangan karir dan profesionalisme</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-1">•</span>
                <span>Inovasi berkelanjutan dalam solusi HR technology</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Milestones */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Perjalanan Kami</h2>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-border"></div>
            <div className="space-y-12">
              {[
                { year: "2018", title: "Pendirian PJM Group", description: "Didirikan dengan visi untuk menyediakan solusi rekrutmen yang inovatif", icon: Building2 },
                { year: "2020", title: "Ekspansi Layanan", description: "Memperluas layanan ke berbagai industri di Indonesia", icon: Globe },
                { year: "2022", title: "Digital Transformation", description: "Meluncurkan platform rekrutmen berbasis teknologi", icon: Zap },
                { year: "2024", title: "Milestone 1000+ Klien", description: "Mencapai 1000+ perusahaan klien dan 10,000+ penempatan", icon: Trophy },
              ].map((milestone, i) => (
                <div key={i} className={`relative flex items-center ${i % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className={`flex-1 ${i % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'}`}>
                    <div className="card-elevated p-6 inline-block">
                      <span className="text-2xl font-bold text-primary">{milestone.year}</span>
                      <h3 className="text-lg font-semibold mt-2">{milestone.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
                    </div>
                  </div>
                  <div className="absolute left-1/2 transform -translate-x-1/2 h-12 w-12 rounded-full bg-primary flex items-center justify-center z-10">
                    <milestone.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1"></div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20">
          {[
            { label: "Tahun Pengalaman", value: "6+", icon: Award },
            { label: "Klien Perusahaan", value: "1000+", icon: Building2 },
            { label: "Penempatan", value: "10,000+", icon: Users },
            { label: "Industri", value: "50+", icon: Globe },
          ].map((stat, i) => (
            <div key={i} className="card-elevated p-6 text-center">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        {/* Values */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <h2 className="text-3xl font-bold text-center mb-12">Nilai Kami</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: "Integritas", description: "Menjunjung kejujuran dan transparansi dalam setiap tindakan", icon: Heart },
              { title: "Inovasi", description: "Terus berinovasi untuk memberikan solusi terbaik", icon: Zap },
              { title: "Kolaborasi", description: "Bekerja sama untuk mencapai tujuan bersama", icon: Users },
            ].map((value, i) => (
              <div key={i} className="card-elevated p-6 text-center">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </PublicLayout>
  );
};

export default About;
