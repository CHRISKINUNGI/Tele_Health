import { PatientList } from '@/components/provider/patient-list';

export default function ProviderPatientsPage() {
    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-gray-900">Patient Directory</h1>
                <p className="text-gray-600">Access patient records, clinical documentation, and medical files.</p>
            </div>

            <PatientList />
        </div>
    );
}
