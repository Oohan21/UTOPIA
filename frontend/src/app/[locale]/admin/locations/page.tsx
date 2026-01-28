'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/lib/api/admin';
import { listingsApi } from '@/lib/api/listings';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/Table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/Dialog';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/Tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/Select';
import { Card, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/use-toast';
import {
    MapPin,
    Building2,
    Sparkles,
    Plus,
    Pencil,
    Trash2,
    Search,
    CheckCircle,
    XCircle,
} from 'lucide-react';

export default function AdminLocationsPage() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('cities');
    const [searchTerm, setSearchTerm] = useState('');

    // City Management
    const [cityDialogOpen, setCityDialogOpen] = useState(false);
    const [editingCity, setEditingCity] = useState<any>(null);
    const [cityForm, setCityForm] = useState({
        name: '',
        name_amharic: '',
        description: '',
        population: '',
    });

    // Sub-city Management
    const [subCityDialogOpen, setSubCityDialogOpen] = useState(false);
    const [editingSubCity, setEditingSubCity] = useState<any>(null);
    const [subCityForm, setSubCityForm] = useState({
        name: '',
        name_amharic: '',
        description: '',
        city: '',
    });

    // Amenity Management
    const [amenityDialogOpen, setAmenityDialogOpen] = useState(false);
    const [editingAmenity, setEditingAmenity] = useState<any>(null);
    const [amenityForm, setAmenityForm] = useState({
        name: '',
        name_amharic: '',
        description: '',
        amenity_type: 'general',
        icon: '',
    });

    // Fetch data
    const { data: citiesData, isLoading: citiesLoading } = useQuery({
        queryKey: ['admin-cities', searchTerm],
        queryFn: () => adminApi.getCitiesAdmin({ search: searchTerm }),
    });

    const { data: subCitiesData, isLoading: subCitiesLoading } = useQuery({
        queryKey: ['admin-subcities', searchTerm],
        queryFn: () => adminApi.getSubCitiesAdmin({ search: searchTerm }),
    });

    const { data: amenitiesData, isLoading: amenitiesLoading } = useQuery({
        queryKey: ['admin-amenities', searchTerm],
        queryFn: () => adminApi.getAmenitiesAdmin({ search: searchTerm }),
    });

    const { data: allCities } = useQuery({
        queryKey: ['cities'],
        queryFn: () => listingsApi.getCities(),
    });

    // Mutations
    const createCityMutation = useMutation({
        mutationFn: adminApi.createCity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
            queryClient.invalidateQueries({ queryKey: ['cities'] });
            toast({ title: 'City created successfully' });
            setCityDialogOpen(false);
            resetCityForm();
        },
    });

    const updateCityMutation = useMutation({
        mutationFn: ({ id, data }: any) => adminApi.updateCity(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
            queryClient.invalidateQueries({ queryKey: ['cities'] });
            toast({ title: 'City updated successfully' });
            setCityDialogOpen(false);
            resetCityForm();
        },
    });

    const deleteCityMutation = useMutation({
        mutationFn: adminApi.deleteCity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
            queryClient.invalidateQueries({ queryKey: ['cities'] });
            toast({ title: 'City deleted successfully' });
        },
    });

    const createSubCityMutation = useMutation({
        mutationFn: adminApi.createSubCity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-subcities'] });
            toast({ title: 'Sub-city created successfully' });
            setSubCityDialogOpen(false);
            resetSubCityForm();
        },
    });

    const updateSubCityMutation = useMutation({
        mutationFn: ({ id, data }: any) => adminApi.updateSubCity(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-subcities'] });
            toast({ title: 'Sub-city updated successfully' });
            setSubCityDialogOpen(false);
            resetSubCityForm();
        },
    });

    const deleteSubCityMutation = useMutation({
        mutationFn: adminApi.deleteSubCity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-subcities'] });
            toast({ title: 'Sub-city deleted successfully' });
        },
    });

    const createAmenityMutation = useMutation({
        mutationFn: adminApi.createAmenity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
            toast({ title: 'Amenity created successfully' });
            setAmenityDialogOpen(false);
            resetAmenityForm();
        },
    });

    const updateAmenityMutation = useMutation({
        mutationFn: ({ id, data }: any) => adminApi.updateAmenity(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
            toast({ title: 'Amenity updated successfully' });
            setAmenityDialogOpen(false);
            resetAmenityForm();
        },
    });

    const deleteAmenityMutation = useMutation({
        mutationFn: adminApi.deleteAmenity,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
            toast({ title: 'Amenity deleted successfully' });
        },
    });

    const toggleCityActiveMutation = useMutation({
        mutationFn: adminApi.toggleCityActive,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-cities'] });
            toast({ title: 'City status updated' });
        },
    });

    const toggleAmenityActiveMutation = useMutation({
        mutationFn: adminApi.toggleAmenityActive,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-amenities'] });
            toast({ title: 'Amenity status updated' });
        },
    });

    // Helper functions
    const resetCityForm = () => {
        setCityForm({ name: '', name_amharic: '', description: '', population: '' });
        setEditingCity(null);
    };

    const resetSubCityForm = () => {
        setSubCityForm({ name: '', name_amharic: '', description: '', city: '' });
        setEditingSubCity(null);
    };

    const resetAmenityForm = () => {
        setAmenityForm({ name: '', name_amharic: '', description: '', amenity_type: 'general', icon: '' });
        setEditingAmenity(null);
    };

    const handleEditCity = (city: any) => {
        setEditingCity(city);
        setCityForm({
            name: city.name,
            name_amharic: city.name_amharic,
            description: city.description || '',
            population: city.population || '',
        });
        setCityDialogOpen(true);
    };

    const handleEditSubCity = (subCity: any) => {
        setEditingSubCity(subCity);
        setSubCityForm({
            name: subCity.name,
            name_amharic: subCity.name_amharic,
            description: subCity.description || '',
            city: subCity.city?.id?.toString() || '',
        });
        setSubCityDialogOpen(true);
    };

    const handleEditAmenity = (amenity: any) => {
        setEditingAmenity(amenity);
        setAmenityForm({
            name: amenity.name,
            name_amharic: amenity.name_amharic || '',
            description: amenity.description || '',
            amenity_type: amenity.amenity_type,
            icon: amenity.icon || '',
        });
        setAmenityDialogOpen(true);
    };

    const handleSaveCity = () => {
        const data = {
            ...cityForm,
            population: cityForm.population ? parseInt(cityForm.population) : null,
        };
        if (editingCity) {
            updateCityMutation.mutate({ id: editingCity.id, data });
        } else {
            createCityMutation.mutate(data);
        }
    };

    const handleSaveSubCity = () => {
        const data = {
            ...subCityForm,
            city: parseInt(subCityForm.city),
        };
        if (editingSubCity) {
            updateSubCityMutation.mutate({ id: editingSubCity.id, data });
        } else {
            createSubCityMutation.mutate(data);
        }
    };

    const handleSaveAmenity = () => {
        if (editingAmenity) {
            updateAmenityMutation.mutate({ id: editingAmenity.id, data: amenityForm });
        } else {
            createAmenityMutation.mutate(amenityForm);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Location Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage cities, sub-cities, and amenities
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="cities" className="gap-2">
                        <MapPin className="h-4 w-4" />
                        Cities
                    </TabsTrigger>
                    <TabsTrigger value="subcities" className="gap-2">
                        <Building2 className="h-4 w-4" />
                        Sub-cities
                    </TabsTrigger>
                    <TabsTrigger value="amenities" className="gap-2">
                        <Sparkles className="h-4 w-4" />
                        Amenities
                    </TabsTrigger>
                </TabsList>

                <Card className="mt-6">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="relative w-96">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            {activeTab === 'cities' && (
                                <Button onClick={() => setCityDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add City
                                </Button>
                            )}
                            {activeTab === 'subcities' && (
                                <Button onClick={() => setSubCityDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Sub-city
                                </Button>
                            )}
                            {activeTab === 'amenities' && (
                                <Button onClick={() => setAmenityDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Amenity
                                </Button>
                            )}
                        </div>

                        <TabsContent value="cities" className="mt-0">
                            {citiesLoading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Amharic Name</TableHead>
                                            <TableHead>Population</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {citiesData?.results?.map((city: any) => (
                                            <TableRow key={city.id}>
                                                <TableCell className="font-medium">{city.name}</TableCell>
                                                <TableCell>{city.name_amharic}</TableCell>
                                                <TableCell>{city.population?.toLocaleString() || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <Badge variant={city.is_active ? 'default' : 'secondary'}>
                                                        {city.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditCity(city)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => toggleCityActiveMutation.mutate(city.id)}
                                                        >
                                                            {city.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to delete this city?')) {
                                                                    deleteCityMutation.mutate(city.id);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </TabsContent>

                        <TabsContent value="subcities" className="mt-0">
                            {subCitiesLoading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Amharic Name</TableHead>
                                            <TableHead>City</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {subCitiesData?.results?.map((subCity: any) => (
                                            <TableRow key={subCity.id}>
                                                <TableCell className="font-medium">{subCity.name}</TableCell>
                                                <TableCell>{subCity.name_amharic}</TableCell>
                                                <TableCell>{subCity.city?.name || 'N/A'}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditSubCity(subCity)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to delete this sub-city?')) {
                                                                    deleteSubCityMutation.mutate(subCity.id);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </TabsContent>

                        <TabsContent value="amenities" className="mt-0">
                            {amenitiesLoading ? (
                                <div className="text-center py-8">Loading...</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Amharic Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {amenitiesData?.results?.map((amenity: any) => (
                                            <TableRow key={amenity.id}>
                                                <TableCell className="font-medium">{amenity.name}</TableCell>
                                                <TableCell>{amenity.name_amharic}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline">{amenity.amenity_type}</Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={amenity.is_active ? 'default' : 'secondary'}>
                                                        {amenity.is_active ? 'Active' : 'Inactive'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleEditAmenity(amenity)}
                                                        >
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => toggleAmenityActiveMutation.mutate(amenity.id)}
                                                        >
                                                            {amenity.is_active ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="destructive"
                                                            onClick={() => {
                                                                if (confirm('Are you sure you want to delete this amenity?')) {
                                                                    deleteAmenityMutation.mutate(amenity.id);
                                                                }
                                                            }}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </TabsContent>
                    </CardContent>
                </Card>
            </Tabs>

            {/* City Dialog */}
            <Dialog open={cityDialogOpen} onOpenChange={setCityDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingCity ? 'Edit City' : 'Add City'}</DialogTitle>
                        <DialogDescription>
                            {editingCity ? 'Update city information' : 'Create a new city'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="city-name">Name</Label>
                            <Input
                                id="city-name"
                                value={cityForm.name}
                                onChange={(e) => setCityForm({ ...cityForm, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="city-name-amharic">Amharic Name</Label>
                            <Input
                                id="city-name-amharic"
                                value={cityForm.name_amharic}
                                onChange={(e) => setCityForm({ ...cityForm, name_amharic: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="city-description">Description</Label>
                            <Input
                                id="city-description"
                                value={cityForm.description}
                                onChange={(e) => setCityForm({ ...cityForm, description: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="city-population">Population</Label>
                            <Input
                                id="city-population"
                                type="number"
                                value={cityForm.population}
                                onChange={(e) => setCityForm({ ...cityForm, population: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCityDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveCity}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Sub-city Dialog */}
            <Dialog open={subCityDialogOpen} onOpenChange={setSubCityDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSubCity ? 'Edit Sub-city' : 'Add Sub-city'}</DialogTitle>
                        <DialogDescription>
                            {editingSubCity ? 'Update sub-city information' : 'Create a new sub-city'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="subcity-city">City</Label>
                            <Select value={subCityForm.city} onValueChange={(value) => setSubCityForm({ ...subCityForm, city: value })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select city" />
                                </SelectTrigger>
                                <SelectContent>
                                    {allCities?.map((city: any) => (
                                        <SelectItem key={city.id} value={city.id.toString()}>
                                            {city.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="subcity-name">Name</Label>
                            <Input
                                id="subcity-name"
                                value={subCityForm.name}
                                onChange={(e) => setSubCityForm({ ...subCityForm, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="subcity-name-amharic">Amharic Name</Label>
                            <Input
                                id="subcity-name-amharic"
                                value={subCityForm.name_amharic}
                                onChange={(e) => setSubCityForm({ ...subCityForm, name_amharic: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="subcity-description">Description</Label>
                            <Input
                                id="subcity-description"
                                value={subCityForm.description}
                                onChange={(e) => setSubCityForm({ ...subCityForm, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSubCityDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveSubCity}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Amenity Dialog */}
            <Dialog open={amenityDialogOpen} onOpenChange={setAmenityDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingAmenity ? 'Edit Amenity' : 'Add Amenity'}</DialogTitle>
                        <DialogDescription>
                            {editingAmenity ? 'Update amenity information' : 'Create a new amenity'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amenity-name">Name</Label>
                            <Input
                                id="amenity-name"
                                value={amenityForm.name}
                                onChange={(e) => setAmenityForm({ ...amenityForm, name: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amenity-name-amharic">Amharic Name</Label>
                            <Input
                                id="amenity-name-amharic"
                                value={amenityForm.name_amharic}
                                onChange={(e) => setAmenityForm({ ...amenityForm, name_amharic: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amenity-type">Type</Label>
                            <Select value={amenityForm.amenity_type} onValueChange={(value) => setAmenityForm({ ...amenityForm, amenity_type: value })}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="general">General</SelectItem>
                                    <SelectItem value="security">Security</SelectItem>
                                    <SelectItem value="recreational">Recreational</SelectItem>
                                    <SelectItem value="utility">Utility</SelectItem>
                                    <SelectItem value="transport">Transport</SelectItem>
                                    <SelectItem value="commercial">Commercial</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="amenity-description">Description</Label>
                            <Input
                                id="amenity-description"
                                value={amenityForm.description}
                                onChange={(e) => setAmenityForm({ ...amenityForm, description: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAmenityDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveAmenity}>Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
